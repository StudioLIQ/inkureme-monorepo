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
    
    uint256 constant DEPOSIT_AMOUNT = 1000 * 10**6;
    uint256 constant INSURANCE_PRICE = 100 * 10**6;
    uint256 constant TOTAL_POLICIES = 10;
    
    function setUp() public {
        token = new MockUSDT();
        oracle = new MockOracle();
        insurance = new FlightDelayInsurance(address(token), address(oracle));
        
        producer = makeAddr("producer");
        buyer1 = makeAddr("buyer1");
        buyer2 = makeAddr("buyer2");
        buyer3 = makeAddr("buyer3");
        
        vm.prank(producer);
        token.mint();
        
        vm.prank(buyer1);
        token.mint();
        
        vm.prank(buyer2);
        token.mint();
        
        vm.prank(buyer3);
        token.mint();
    }
    
    function test_CreateInsurance() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed on 2024-03-15?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        
        assertEq(flightId, 1);
        
        (
            address flightProducer,
            uint256 depositAmount,
            uint256 insurancePrice,
            uint256 totalPolicies,
            uint256 soldPolicies,
            bytes32 questionId,
            bool resolved,
            bool delayed
        ) = insurance.getFlightInfo(flightId);
        
        assertEq(flightProducer, producer);
        assertEq(depositAmount, DEPOSIT_AMOUNT);
        assertEq(insurancePrice, INSURANCE_PRICE);
        assertEq(totalPolicies, TOTAL_POLICIES);
        assertEq(soldPolicies, 0);
        assertTrue(questionId != bytes32(0));
        assertFalse(resolved);
        assertFalse(delayed);
        vm.stopPrank();
    }
    
    function test_CreateInsuranceInsufficientDeposit() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        
        vm.expectRevert("Deposit must cover all potential payouts");
        insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE * 2,
            TOTAL_POLICIES
        );
        vm.stopPrank();
    }
    
    function test_BuyInsurance() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        insurance.buyInsurance(flightId);
        
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer1));
        
        (,,,, uint256 soldPolicies,,,) = insurance.getFlightInfo(flightId);
        assertEq(soldPolicies, 1);
        vm.stopPrank();
    }
    
    function test_BuyInsuranceAlreadyPurchased() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE * 2);
        insurance.buyInsurance(flightId);
        
        vm.expectRevert("Already purchased");
        insurance.buyInsurance(flightId);
        vm.stopPrank();
    }
    
    function test_MultipleBuyers() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        vm.prank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.prank(buyer1);
        insurance.buyInsurance(flightId);
        
        vm.prank(buyer2);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.prank(buyer2);
        insurance.buyInsurance(flightId);
        
        vm.prank(buyer3);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.prank(buyer3);
        insurance.buyInsurance(flightId);
        
        (,,,, uint256 soldPolicies,,,) = insurance.getFlightInfo(flightId);
        assertEq(soldPolicies, 3);
        
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer1));
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer2));
        assertTrue(insurance.hasPurchasedPolicy(flightId, buyer3));
    }
    
    function test_ResolveInsuranceDelayed() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        (,,,,, bytes32 questionId,,) = insurance.getFlightInfo(flightId);
        
        oracle.setResult(questionId, bytes32(uint256(1)));
        
        insurance.resolveInsurance(flightId);
        
        (,,,,,, bool resolved, bool delayed) = insurance.getFlightInfo(flightId);
        assertTrue(resolved);
        assertTrue(delayed);
    }
    
    function test_ResolveInsuranceNotDelayed() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        (,,,,, bytes32 questionId,,) = insurance.getFlightInfo(flightId);
        
        oracle.setResult(questionId, bytes32(uint256(2)));
        
        insurance.resolveInsurance(flightId);
        
        (,,,,,, bool resolved, bool delayed) = insurance.getFlightInfo(flightId);
        assertTrue(resolved);
        assertFalse(delayed);
    }
    
    function test_ClaimPayoutWhenDelayed() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        insurance.buyInsurance(flightId);
        vm.stopPrank();
        
        (,,,,, bytes32 questionId,,) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, bytes32(uint256(1)));
        insurance.resolveInsurance(flightId);
        
        uint256 balanceBefore = token.balanceOf(buyer1);
        
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        
        uint256 balanceAfter = token.balanceOf(buyer1);
        uint256 expectedPayout = DEPOSIT_AMOUNT / TOTAL_POLICIES;
        assertEq(balanceAfter - balanceBefore, expectedPayout);
        
        assertTrue(insurance.hasClaimedPayout(flightId, buyer1));
    }
    
    function test_ClaimPayoutAlreadyClaimed() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        vm.startPrank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        insurance.buyInsurance(flightId);
        vm.stopPrank();
        
        (,,,,, bytes32 questionId,,) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, bytes32(uint256(1)));
        insurance.resolveInsurance(flightId);
        
        vm.prank(buyer1);
        insurance.claimPayout(flightId);
        
        vm.prank(buyer1);
        vm.expectRevert("Already claimed");
        insurance.claimPayout(flightId);
    }
    
    function test_RefundDepositWhenNotDelayed() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        vm.prank(buyer1);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.prank(buyer1);
        insurance.buyInsurance(flightId);
        
        vm.prank(buyer2);
        token.approve(address(insurance), INSURANCE_PRICE);
        vm.prank(buyer2);
        insurance.buyInsurance(flightId);
        
        (,,,,, bytes32 questionId,,) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, bytes32(uint256(2)));
        insurance.resolveInsurance(flightId);
        
        uint256 balanceBefore = token.balanceOf(producer);
        
        vm.prank(producer);
        insurance.refundDeposit(flightId);
        
        uint256 balanceAfter = token.balanceOf(producer);
        uint256 expectedRefund = DEPOSIT_AMOUNT + (INSURANCE_PRICE * 2);
        assertEq(balanceAfter - balanceBefore, expectedRefund);
    }
    
    function test_RefundDepositWhenDelayedShouldFail() public {
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT);
        uint256 flightId = insurance.createInsurance(
            "Will flight AA123 be delayed?",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        vm.stopPrank();
        
        (,,,,, bytes32 questionId,,) = insurance.getFlightInfo(flightId);
        oracle.setResult(questionId, bytes32(uint256(1)));
        insurance.resolveInsurance(flightId);
        
        vm.prank(producer);
        vm.expectRevert("Cannot refund when flight was delayed");
        insurance.refundDeposit(flightId);
    }
    
    function test_GetTotalFlights() public {
        assertEq(insurance.getTotalFlights(), 0);
        
        vm.startPrank(producer);
        token.approve(address(insurance), DEPOSIT_AMOUNT * 2);
        
        insurance.createInsurance(
            "Flight 1",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        assertEq(insurance.getTotalFlights(), 1);
        
        insurance.createInsurance(
            "Flight 2",
            DEPOSIT_AMOUNT,
            INSURANCE_PRICE,
            TOTAL_POLICIES
        );
        assertEq(insurance.getTotalFlights(), 2);
        
        vm.stopPrank();
    }
}