// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {FlightDelayInsurance} from "../src/FlightDelayInsurance.sol";
import {IRealityERC20} from "../src/interfaces/IRealityERC20.sol";

contract MockOracle is IRealityERC20 {
    mapping(bytes32 => bytes32) public results;
    uint256 private questionCounter;
    
    function askQuestion(
        uint32,
        string calldata,
        address,
        uint32,
        uint32,
        bytes32
    ) external returns (bytes32 questionId) {
        questionId = bytes32(++questionCounter);
    }
    
    function submitAnswer(bytes32, bytes32, uint256) external {}
    function finalize(bytes32) external {}
    
    function resultFor(bytes32 questionId) external view returns (bytes32) {
        return results[questionId];
    }
    
    function getFinalAnswerIfMatches(
        bytes32,
        bytes32,
        address,
        uint32,
        uint256
    ) external pure returns (bytes32) {
        return bytes32(0);
    }
    
    function claimWinnings(bytes32) external {}
    
    function setResult(bytes32 questionId, bytes32 result) external {
        results[questionId] = result;
    }
}

contract FlightDelayInsuranceTest is Test {
    MockUSDT public token;
    MockOracle public oracle;
    FlightDelayInsurance public insurance;
    
    address public producer;
    address public buyer1;
    address public buyer2;
    address public buyer3;
    
    uint256 constant PAYOUT_PER_POLICY = 100 * 10**6; // 100 mUSDT
    uint256 constant INSURANCE_PRICE = 30 * 10**6; // 30 mUSDT
    uint256 constant TOTAL_POLICIES = 10;
    uint256 constant DEPOSIT_AMOUNT = PAYOUT_PER_POLICY * TOTAL_POLICIES; // 1000 mUSDT
    
    bytes32 constant YES_ANSWER = bytes32(uint256(1)); // Flight delayed
    bytes32 constant NO_ANSWER = bytes32(uint256(2)); // Flight on time
    
    event InsuranceCreated(
        uint256 indexed flightId,
        address indexed producer,
        uint256 depositAmount,
        uint256 insurancePrice,
        uint256 totalPolicies,
        bytes32 questionId,
        string flightQuestion
    );
    
    event InsurancePurchased(
        uint256 indexed flightId,
        address indexed buyer,
        uint256 insurancePrice
    );
    
    event InsuranceSettled(
        uint256 indexed flightId,
        bool delayed,
        bytes32 answer,
        uint256 producerWithdrawable
    );
    
    event PayoutClaimed(
        uint256 indexed flightId,
        address indexed claimer,
        uint256 amount
    );
    
    event FundsWithdrawn(
        uint256 indexed flightId,
        address indexed producer,
        uint256 amount
    );
    
    function setUp() public {
        token = new MockUSDT();
        oracle = new MockOracle();
        insurance = new FlightDelayInsurance(address(token), address(oracle));
        
        producer = makeAddr("producer");
        buyer1 = makeAddr("buyer1");
        buyer2 = makeAddr("buyer2");
        buyer3 = makeAddr("buyer3");
        
        // Mint tokens for all participants
        vm.prank(producer);
        token.mint();
        
        vm.prank(buyer1);
        token.mint();
        
        vm.prank(buyer2);
        token.mint();
        
        vm.prank(buyer3);
        token.mint();
    }
    
    // ============ Create Insurance Tests ============
    
    function test_CreateInsurance_Success() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        
        vm.expectEmit(true, true, false, true);
        emit InsuranceCreated(
            1,
            producer,
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES,
            bytes32(uint256(1)),
            "Will flight AA123 be delayed on 2024-03-15?"
        );
        
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed on 2024-03-15?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        assertEq(flightId, 1);
        assertEq(token.balanceOf(address(insurance)), DEPOSIT_AMOUNT);
        
        (
            address flightProducer,
            uint256 depositAmount,
            uint256 insurancePrice,
            uint256 totalPolicies,
            uint256 soldPolicies,
            bytes32 questionId,
            bool settled,
            bool delayed,
            uint256 producerWithdrawable,
            bool producerWithdrawn
        ) = insurance.getFlightInfo(flightId);
        
        assertEq(flightProducer, producer);
        assertEq(depositAmount, DEPOSIT_AMOUNT);
        assertEq(insurancePrice, INSURANCE_PRICE);
        assertEq(totalPolicies, TOTAL_POLICIES);
        assertEq(soldPolicies, 0);
        assertTrue(questionId != bytes32(0));
        assertFalse(settled);
        assertFalse(delayed);
        assertEq(producerWithdrawable, 0);
        assertFalse(producerWithdrawn);
    }
    
    function test_CreateInsurance_InvalidParameters() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        
        // Test zero deposit
        vm.expectRevert(FlightDelayInsurance.InvalidDeposit.selector);
        insurance.createInsurance("Test", 0, INSURANCE_PRICE, TOTAL_POLICIES);
        
        // Test zero price
        vm.expectRevert(FlightDelayInsurance.InvalidPrice.selector);
        insurance.createInsurance("Test", DEPOSIT_AMOUNT, 0, TOTAL_POLICIES);
        
        // Test zero policies
        vm.expectRevert(FlightDelayInsurance.InvalidPolicies.selector);
        insurance.createInsurance("Test", DEPOSIT_AMOUNT, INSURANCE_PRICE, 0);
        
        // Test insufficient deposit
        vm.expectRevert(FlightDelayInsurance.InsufficientDeposit.selector);
        insurance.createInsurance("Test", 500 * 10**6, INSURANCE_PRICE, TOTAL_POLICIES);
        
        vm.stopPrank();
    }
    
    // ============ Buy Insurance Tests ============
    
    function test_BuyInsurance_Success() public {
        uint256 flightId = createDefaultInsurance();
        
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        
        vm.expectEmit(true, true, false, true);
        emit InsurancePurchased(flightId, buyer1, INSURANCE_PRICE);
        
        insurance.buyInsurance(flightId);
        vm.stopPrank();
        
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer1));
        
        (,,,, uint256 soldPolicies,,,,,) = insurance.getFlightInfo(flightId);
        assertEq(soldPolicies, 1);
    }
    
    function test_BuyInsurance_MultipleBuyers() public {
        uint256 flightId = createDefaultInsurance();
        
        // Buy policies with 3 different buyers
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        buyPolicy(buyer3, flightId);
        
        (,,,, uint256 soldPolicies,,,,,) = insurance.getFlightInfo(flightId);
        assertEq(soldPolicies, 3);
        
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer1));
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer2));
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer3));
    }
    
    function test_BuyInsurance_AlreadyPurchased() public {
        uint256 flightId = createDefaultInsurance();
        
        buyPolicy(buyer1, flightId);
        
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.expectRevert(FlightDelayInsurance.AlreadyPurchased.selector);
        insurance.buyInsurance(flightId);
        vm.stopPrank();
    }
    
    function test_BuyInsurance_NonExistentFlight() public {
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.expectRevert(FlightDelayInsurance.FlightDoesNotExist.selector);
        insurance.buyInsurance(999);
        vm.stopPrank();
    }
    
    function test_BuyInsurance_AfterSettlement() public {
        uint256 flightId = createDefaultInsurance();
        settleFlightDelayed(flightId);
        
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.expectRevert(FlightDelayInsurance.FlightAlreadySettled.selector);
        insurance.buyInsurance(flightId);
        vm.stopPrank();
    }
    
    // ============ Settlement Tests ============
    
    function test_SettleInsurance_FlightDelayed() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        
        (,,,,, bytes32 questionId,,,, ) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, YES_ANSWER);
        
        uint256 expectedProducerWithdrawable = 2 * INSURANCE_PRICE; // Only sales revenue
        
        vm.expectEmit(true, false, false, true);
        emit InsuranceSettled(flightId, true, YES_ANSWER, expectedProducerWithdrawable);
        
        insurance.settleInsurance(flightId);
        
        (,,,,,, bool settled, bool delayed, uint256 producerWithdrawable,) = insurance.getFlightInfo(flightId);
        assertTrue(settled);
        assertTrue(delayed);
        assertEq(producerWithdrawable, expectedProducerWithdrawable);
    }
    
    function test_SettleInsurance_FlightOnTime() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        
        (,,,,, bytes32 questionId,,,, ) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, NO_ANSWER);
        
        uint256 expectedProducerWithdrawable = DEPOSIT_AMOUNT + (2 * INSURANCE_PRICE); // Deposit + sales
        
        vm.expectEmit(true, false, false, true);
        emit InsuranceSettled(flightId, false, NO_ANSWER, expectedProducerWithdrawable);
        
        insurance.settleInsurance(flightId);
        
        (,,,,,, bool settled, bool delayed, uint256 producerWithdrawable,) = insurance.getFlightInfo(flightId);
        assertTrue(settled);
        assertFalse(delayed);
        assertEq(producerWithdrawable, expectedProducerWithdrawable);
    }
    
    function test_SettleInsurance_AlreadySettled() public {
        uint256 flightId = createDefaultInsurance();
        settleFlightDelayed(flightId);
        
        vm.expectRevert(FlightDelayInsurance.FlightAlreadySettled.selector);
        insurance.settleInsurance(flightId);
    }
    
    function test_SettleInsurance_OracleNotResolved() public {
        uint256 flightId = createDefaultInsurance();
        
        vm.expectRevert(FlightDelayInsurance.OracleNotResolved.selector);
        insurance.settleInsurance(flightId);
    }
    
    // ============ Claim Payout Tests ============
    
    function test_ClaimPayout_Success() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        settleFlightDelayed(flightId);
        
        uint256 balanceBefore = token.balanceOf(buyer1);
        
        vm.expectEmit(true, true, false, true);
        emit PayoutClaimed(flightId, buyer1, PAYOUT_PER_POLICY);
        
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        
        uint256 balanceAfter = token.balanceOf(buyer1);
        assertEq(balanceAfter - balanceBefore, PAYOUT_PER_POLICY);
        assertTrue(insurance.hasClaimedPayout(flightId, buyer1));
    }
    
    function test_ClaimPayout_MultipleBuyers() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        buyPolicy(buyer3, flightId);
        settleFlightDelayed(flightId);
        
        // All buyers claim their payouts
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        
        vm.prank(buyer2);
        insurance.claimPayout(flightId);
        
        vm.prank(buyer3);
        insurance.claimPayout(flightId);
        
        assertTrue(insurance.hasClaimedPayout(flightId, buyer1));
        assertTrue(insurance.hasClaimedPayout(flightId, buyer2));
        assertTrue(insurance.hasClaimedPayout(flightId, buyer3));
    }
    
    function test_ClaimPayout_AlreadyClaimed() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        settleFlightDelayed(flightId);
        
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        
        vm.prank(buyer1);
        vm.expectRevert(FlightDelayInsurance.AlreadyClaimed.selector);
        insurance.claimPayout(flightId);
    }
    
    function test_ClaimPayout_NotSettled() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        
        vm.prank(buyer1);
        vm.expectRevert(FlightDelayInsurance.FlightNotSettled.selector);
        insurance.claimPayout(flightId);
    }
    
    function test_ClaimPayout_FlightNotDelayed() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        settleFlightOnTime(flightId);
        
        vm.prank(buyer1);
        vm.expectRevert(FlightDelayInsurance.FlightNotDelayed.selector);
        insurance.claimPayout(flightId);
    }
    
    function test_ClaimPayout_NoPolicyPurchased() public {
        uint256 flightId = createDefaultInsurance();
        settleFlightDelayed(flightId);
        
        vm.prank(buyer1);
        vm.expectRevert(FlightDelayInsurance.NoPolicyPurchased.selector);
        insurance.claimPayout(flightId);
    }
    
    // ============ Withdraw Funds Tests ============
    
    function test_WithdrawFunds_FlightDelayed() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        settleFlightDelayed(flightId);
        
        uint256 expectedAmount = 2 * INSURANCE_PRICE; // Only sales revenue
        uint256 balanceBefore = token.balanceOf(producer);
        
        vm.expectEmit(true, true, false, true);
        emit FundsWithdrawn(flightId, producer, expectedAmount);
        
        vm.prank(producer);
        insurance.withdrawFunds(flightId);
        
        uint256 balanceAfter = token.balanceOf(producer);
        assertEq(balanceAfter - balanceBefore, expectedAmount);
        
        (,,,,,,,,, bool producerWithdrawn) = insurance.getFlightInfo(flightId);
        assertTrue(producerWithdrawn);
    }
    
    function test_WithdrawFunds_FlightOnTime() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        settleFlightOnTime(flightId);
        
        uint256 expectedAmount = DEPOSIT_AMOUNT + (2 * INSURANCE_PRICE); // Deposit + sales
        uint256 balanceBefore = token.balanceOf(producer);
        
        vm.expectEmit(true, true, false, true);
        emit FundsWithdrawn(flightId, producer, expectedAmount);
        
        vm.prank(producer);
        insurance.withdrawFunds(flightId);
        
        uint256 balanceAfter = token.balanceOf(producer);
        assertEq(balanceAfter - balanceBefore, expectedAmount);
    }
    
    function test_WithdrawFunds_AlreadyWithdrawn() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        settleFlightOnTime(flightId);
        
        vm.prank(producer);
        insurance.withdrawFunds(flightId);
        
        vm.prank(producer);
        vm.expectRevert(FlightDelayInsurance.AlreadyWithdrawn.selector);
        insurance.withdrawFunds(flightId);
    }
    
    function test_WithdrawFunds_NotProducer() public {
        uint256 flightId = createDefaultInsurance();
        settleFlightOnTime(flightId);
        
        vm.prank(buyer1);
        vm.expectRevert(FlightDelayInsurance.NotProducer.selector);
        insurance.withdrawFunds(flightId);
    }
    
    function test_WithdrawFunds_NotSettled() public {
        uint256 flightId = createDefaultInsurance();
        
        vm.prank(producer);
        vm.expectRevert(FlightDelayInsurance.FlightNotSettled.selector);
        insurance.withdrawFunds(flightId);
    }
    
    // ============ Integration Tests ============
    
    function test_FullFlow_FlightDelayed() public {
        // Create insurance
        uint256 flightId = createDefaultInsurance();
        
        // Multiple buyers purchase policies
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        buyPolicy(buyer3, flightId);
        
        // Settle as delayed
        settleFlightDelayed(flightId);
        
        // Buyers claim payouts
        uint256 buyer1BalanceBefore = token.balanceOf(buyer1);
        uint256 buyer2BalanceBefore = token.balanceOf(buyer2);
        uint256 buyer3BalanceBefore = token.balanceOf(buyer3);
        
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        
        vm.prank(buyer2);
        insurance.claimPayout(flightId);
        
        vm.prank(buyer3);
        insurance.claimPayout(flightId);
        
        assertEq(token.balanceOf(buyer1) - buyer1BalanceBefore, PAYOUT_PER_POLICY);
        assertEq(token.balanceOf(buyer2) - buyer2BalanceBefore, PAYOUT_PER_POLICY);
        assertEq(token.balanceOf(buyer3) - buyer3BalanceBefore, PAYOUT_PER_POLICY);
        
        // Producer withdraws sales revenue only
        uint256 producerBalanceBefore = token.balanceOf(producer);
        vm.prank(producer);
        insurance.withdrawFunds(flightId);
        
        uint256 expectedProducerAmount = 3 * INSURANCE_PRICE;
        assertEq(token.balanceOf(producer) - producerBalanceBefore, expectedProducerAmount);
    }
    
    function test_FullFlow_FlightOnTime() public {
        // Create insurance
        uint256 flightId = createDefaultInsurance();
        
        // Multiple buyers purchase policies
        buyPolicy(buyer1, flightId);
        buyPolicy(buyer2, flightId);
        
        // Settle as on time
        settleFlightOnTime(flightId);
        
        // Buyers cannot claim (flight was on time)
        vm.prank(buyer1);
        vm.expectRevert(FlightDelayInsurance.FlightNotDelayed.selector);
        insurance.claimPayout(flightId);
        
        // Producer withdraws deposit + sales revenue
        uint256 producerBalanceBefore = token.balanceOf(producer);
        vm.prank(producer);
        insurance.withdrawFunds(flightId);
        
        uint256 expectedProducerAmount = DEPOSIT_AMOUNT + (2 * INSURANCE_PRICE);
        assertEq(token.balanceOf(producer) - producerBalanceBefore, expectedProducerAmount);
    }
    
    function test_DoubleClaimPrevention() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        settleFlightDelayed(flightId);
        
        // First claim succeeds
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        
        // Second claim fails
        vm.prank(buyer1);
        vm.expectRevert(FlightDelayInsurance.AlreadyClaimed.selector);
        insurance.claimPayout(flightId);
        
        // Producer withdraws successfully
        vm.prank(producer);
        insurance.withdrawFunds(flightId);
        
        // Producer cannot withdraw again
        vm.prank(producer);
        vm.expectRevert(FlightDelayInsurance.AlreadyWithdrawn.selector);
        insurance.withdrawFunds(flightId);
    }
    
    // ============ View Function Tests ============
    
    function test_ViewFunctions() public {
        uint256 flightId = createDefaultInsurance();
        buyPolicy(buyer1, flightId);
        
        // Test calculateBuyerPayout before settlement
        assertEq(insurance.calculateBuyerPayout(flightId, buyer1), 0);
        
        // Test calculateProducerRefund before settlement
        assertEq(insurance.calculateProducerRefund(flightId), 0);
        
        settleFlightDelayed(flightId);
        
        // Test calculateBuyerPayout after settlement
        assertEq(insurance.calculateBuyerPayout(flightId, buyer1), PAYOUT_PER_POLICY);
        assertEq(insurance.calculateBuyerPayout(flightId, buyer2), 0); // No policy
        
        // Test calculateProducerRefund after settlement
        assertEq(insurance.calculateProducerRefund(flightId), INSURANCE_PRICE);
        
        // Test after claim
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        assertEq(insurance.calculateBuyerPayout(flightId, buyer1), 0); // Already claimed
        
        // Test getTotalFlights
        assertEq(insurance.getTotalFlights(), 1);
        createDefaultInsurance();
        assertEq(insurance.getTotalFlights(), 2);
    }
    
    // ============ Helper Functions ============
    
    function createDefaultInsurance() internal returns (uint256) {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        return flightId;
    }
    
    function buyPolicy(address buyer, uint256 flightId) internal {
        vm.startPrank(buyer);
        token.approve(address(insurance), INSURANCE_PRICE);
        insurance.buyInsurance(flightId);
        vm.stopPrank();
    }
    
    function settleFlightDelayed(uint256 flightId) internal {
        (,,,,, bytes32 questionId,,,,) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, YES_ANSWER);
        insurance.settleInsurance(flightId);
    }
    
    function settleFlightOnTime(uint256 flightId) internal {
        (,,,,, bytes32 questionId,,,,) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, NO_ANSWER);
        insurance.settleInsurance(flightId);
    }
}