// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IRealityERC20} from "./interfaces/IRealityERC20.sol";

contract FlightDelayInsurance is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Flight {
        address producer;
        uint256 depositAmount;
        uint256 insurancePrice;
        uint256 totalPolicies;
        uint256 soldPolicies;
        bytes32 questionId;
        bool settled;
        bool delayed;
        uint256 producerWithdrawable;
        bool producerWithdrawn;
    }

    struct PolicyPurchase {
        bool purchased;
        bool claimed;
    }

    IERC20 public immutable TOKEN;
    IRealityERC20 public immutable ORACLE;
    
    uint256 private flightCounter;
    uint32 public constant QUESTION_TIMEOUT = 86400;
    uint32 public constant TEMPLATE_ID = 0;
    uint256 public constant PAYOUT_PER_POLICY = 100 * 10**6; // 100 mUSDT
    bytes32 public constant YES_ANSWER = bytes32(uint256(1));
    
    mapping(uint256 => Flight) public flights;
    mapping(uint256 => mapping(address => PolicyPurchase)) public policies;
    
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

    error FlightDoesNotExist();
    error FlightAlreadySettled();
    error FlightNotSettled();
    error AllPoliciesSold();
    error AlreadyPurchased();
    error NoPolicyPurchased();
    error AlreadyClaimed();
    error FlightNotDelayed();
    error NotProducer();
    error AlreadyWithdrawn();
    error NoFundsToWithdraw();
    error OracleNotResolved();
    error InvalidDeposit();
    error InvalidPrice();
    error InvalidPolicies();
    error InsufficientDeposit();

    constructor(address _token, address _oracle) {
        require(_token != address(0), "Invalid token address");
        require(_oracle != address(0), "Invalid oracle address");
        TOKEN = IERC20(_token);
        ORACLE = IRealityERC20(_oracle);
    }

    function createInsurance(
        string memory flightQuestion,
        uint256 depositAmount,
        uint256 insurancePrice,
        uint256 totalPolicies
    ) external nonReentrant returns (uint256 flightId) {
        if (depositAmount == 0) revert InvalidDeposit();
        if (insurancePrice == 0) revert InvalidPrice();
        if (totalPolicies == 0) revert InvalidPolicies();
        
        uint256 requiredDeposit = PAYOUT_PER_POLICY * totalPolicies;
        if (depositAmount < requiredDeposit) revert InsufficientDeposit();
        
        TOKEN.safeTransferFrom(msg.sender, address(this), depositAmount);
        
        bytes32 nonce = keccak256(abi.encodePacked(block.timestamp, msg.sender, flightCounter));
        bytes32 questionId = ORACLE.askQuestion(
            TEMPLATE_ID,
            flightQuestion,
            address(0),
            QUESTION_TIMEOUT,
            0,
            nonce
        );
        
        flightId = ++flightCounter;
        
        flights[flightId] = Flight({
            producer: msg.sender,
            depositAmount: depositAmount,
            insurancePrice: insurancePrice,
            totalPolicies: totalPolicies,
            soldPolicies: 0,
            questionId: questionId,
            settled: false,
            delayed: false,
            producerWithdrawable: 0,
            producerWithdrawn: false
        });
        
        emit InsuranceCreated(
            flightId,
            msg.sender,
            depositAmount,
            insurancePrice,
            totalPolicies,
            questionId,
            flightQuestion
        );
    }

    function buyInsurance(uint256 flightId) external nonReentrant {
        Flight storage flight = flights[flightId];
        if (flight.producer == address(0)) revert FlightDoesNotExist();
        if (flight.settled) revert FlightAlreadySettled();
        if (flight.soldPolicies >= flight.totalPolicies) revert AllPoliciesSold();
        if (policies[flightId][msg.sender].purchased) revert AlreadyPurchased();
        
        TOKEN.safeTransferFrom(msg.sender, address(this), flight.insurancePrice);
        
        flight.soldPolicies++;
        policies[flightId][msg.sender] = PolicyPurchase({
            purchased: true,
            claimed: false
        });
        
        emit InsurancePurchased(flightId, msg.sender, flight.insurancePrice);
    }

    function settleInsurance(uint256 flightId) external nonReentrant {
        Flight storage flight = flights[flightId];
        if (flight.producer == address(0)) revert FlightDoesNotExist();
        if (flight.settled) revert FlightAlreadySettled();
        
        bytes32 answer = ORACLE.resultFor(flight.questionId);
        if (answer == bytes32(0)) revert OracleNotResolved();
        
        flight.settled = true;
        flight.delayed = (answer == YES_ANSWER);
        
        if (flight.delayed) {
            // Flight was delayed - buyers can claim payouts
            // Producer can only withdraw sales revenue
            flight.producerWithdrawable = flight.soldPolicies * flight.insurancePrice;
        } else {
            // Flight was on time - producer gets everything
            flight.producerWithdrawable = flight.depositAmount + (flight.soldPolicies * flight.insurancePrice);
        }
        
        emit InsuranceSettled(flightId, flight.delayed, answer, flight.producerWithdrawable);
    }

    function claimPayout(uint256 flightId) external nonReentrant {
        Flight storage flight = flights[flightId];
        if (!flight.settled) revert FlightNotSettled();
        if (!flight.delayed) revert FlightNotDelayed();
        
        PolicyPurchase storage policy = policies[flightId][msg.sender];
        if (!policy.purchased) revert NoPolicyPurchased();
        if (policy.claimed) revert AlreadyClaimed();
        
        policy.claimed = true;
        
        TOKEN.safeTransfer(msg.sender, PAYOUT_PER_POLICY);
        
        emit PayoutClaimed(flightId, msg.sender, PAYOUT_PER_POLICY);
    }

    function withdrawFunds(uint256 flightId) external nonReentrant {
        Flight storage flight = flights[flightId];
        if (flight.producer != msg.sender) revert NotProducer();
        if (!flight.settled) revert FlightNotSettled();
        if (flight.producerWithdrawn) revert AlreadyWithdrawn();
        if (flight.producerWithdrawable == 0) revert NoFundsToWithdraw();
        
        uint256 amount = flight.producerWithdrawable;
        flight.producerWithdrawn = true;
        flight.producerWithdrawable = 0;
        
        TOKEN.safeTransfer(msg.sender, amount);
        
        emit FundsWithdrawn(flightId, msg.sender, amount);
    }

    // View functions
    function getFlightInfo(uint256 flightId) external view returns (
        address producer,
        uint256 depositAmount,
        uint256 insurancePrice,
        uint256 totalPolicies,
        uint256 soldPolicies,
        bytes32 questionId,
        bool settled,
        bool delayed,
        uint256 producerWithdrawable,
        bool producerWithdrawn
    ) {
        Flight storage flight = flights[flightId];
        return (
            flight.producer,
            flight.depositAmount,
            flight.insurancePrice,
            flight.totalPolicies,
            flight.soldPolicies,
            flight.questionId,
            flight.settled,
            flight.delayed,
            flight.producerWithdrawable,
            flight.producerWithdrawn
        );
    }

    function hasPurchasedPolicy(uint256 flightId, address buyer) external view returns (bool) {
        return policies[flightId][buyer].purchased;
    }

    function hasClaimedPayout(uint256 flightId, address buyer) external view returns (bool) {
        return policies[flightId][buyer].claimed;
    }

    function getTotalFlights() external view returns (uint256) {
        return flightCounter;
    }

    function getOracleAnswer(uint256 flightId) external view returns (bytes32) {
        return ORACLE.resultFor(flights[flightId].questionId);
    }

    function calculateProducerRefund(uint256 flightId) external view returns (uint256) {
        Flight storage flight = flights[flightId];
        if (!flight.settled) return 0;
        return flight.producerWithdrawable;
    }

    function calculateBuyerPayout(uint256 flightId, address buyer) external view returns (uint256) {
        Flight storage flight = flights[flightId];
        PolicyPurchase storage policy = policies[flightId][buyer];
        
        if (!flight.settled || !flight.delayed || !policy.purchased || policy.claimed) {
            return 0;
        }
        return PAYOUT_PER_POLICY;
    }
}