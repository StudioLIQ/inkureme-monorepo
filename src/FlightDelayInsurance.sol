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
        bool resolved;
        bool delayed;
    }

    struct PolicyPurchase {
        bool purchased;
        bool claimed;
    }

    IERC20 public immutable token;
    IRealityERC20 public immutable oracle;
    
    uint256 private flightCounter;
    uint32 public constant QUESTION_TIMEOUT = 86400;
    uint32 public constant TEMPLATE_ID = 0;
    
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
    
    event InsuranceResolved(
        uint256 indexed flightId,
        bool delayed,
        bytes32 answer
    );
    
    event PayoutClaimed(
        uint256 indexed flightId,
        address indexed claimer,
        uint256 amount
    );
    
    event DepositRefunded(
        uint256 indexed flightId,
        address indexed producer,
        uint256 amount
    );

    constructor(address _token, address _oracle) {
        require(_token != address(0), "Invalid token address");
        require(_oracle != address(0), "Invalid oracle address");
        token = IERC20(_token);
        oracle = IRealityERC20(_oracle);
    }

    function createInsurance(
        string memory flightQuestion,
        uint256 depositAmount,
        uint256 insurancePrice,
        uint256 totalPolicies
    ) external nonReentrant returns (uint256 flightId) {
        require(depositAmount > 0, "Deposit must be greater than 0");
        require(insurancePrice > 0, "Insurance price must be greater than 0");
        require(totalPolicies > 0, "Total policies must be greater than 0");
        require(
            depositAmount >= insurancePrice * totalPolicies,
            "Deposit must cover all potential payouts"
        );
        
        token.safeTransferFrom(msg.sender, address(this), depositAmount);
        
        bytes32 nonce = keccak256(abi.encodePacked(block.timestamp, msg.sender, flightCounter));
        bytes32 questionId = oracle.askQuestion(
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
            resolved: false,
            delayed: false
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
        require(flight.producer != address(0), "Flight does not exist");
        require(!flight.resolved, "Flight already resolved");
        require(flight.soldPolicies < flight.totalPolicies, "All policies sold");
        require(!policies[flightId][msg.sender].purchased, "Already purchased");
        
        token.safeTransferFrom(msg.sender, address(this), flight.insurancePrice);
        
        flight.soldPolicies++;
        policies[flightId][msg.sender] = PolicyPurchase({
            purchased: true,
            claimed: false
        });
        
        emit InsurancePurchased(flightId, msg.sender, flight.insurancePrice);
    }

    function resolveInsurance(uint256 flightId) external nonReentrant {
        Flight storage flight = flights[flightId];
        require(flight.producer != address(0), "Flight does not exist");
        require(!flight.resolved, "Already resolved");
        
        bytes32 answer = oracle.resultFor(flight.questionId);
        require(answer != bytes32(0), "Oracle has not resolved yet");
        
        flight.resolved = true;
        flight.delayed = (answer == bytes32(uint256(1)));
        
        emit InsuranceResolved(flightId, flight.delayed, answer);
    }

    function claimPayout(uint256 flightId) external nonReentrant {
        Flight storage flight = flights[flightId];
        require(flight.resolved, "Flight not resolved");
        require(flight.delayed, "Flight was not delayed");
        require(policies[flightId][msg.sender].purchased, "No policy purchased");
        require(!policies[flightId][msg.sender].claimed, "Already claimed");
        
        policies[flightId][msg.sender].claimed = true;
        
        uint256 payoutAmount = flight.depositAmount / flight.totalPolicies;
        token.safeTransfer(msg.sender, payoutAmount);
        
        emit PayoutClaimed(flightId, msg.sender, payoutAmount);
    }

    function refundDeposit(uint256 flightId) external nonReentrant {
        Flight storage flight = flights[flightId];
        require(flight.producer == msg.sender, "Not the producer");
        require(flight.resolved, "Flight not resolved");
        require(!flight.delayed, "Cannot refund when flight was delayed");
        
        uint256 refundAmount = flight.depositAmount;
        uint256 premiumsCollected = flight.soldPolicies * flight.insurancePrice;
        uint256 totalRefund = refundAmount + premiumsCollected;
        
        flight.depositAmount = 0;
        
        token.safeTransfer(msg.sender, totalRefund);
        
        emit DepositRefunded(flightId, msg.sender, totalRefund);
    }

    function getFlightInfo(uint256 flightId) external view returns (
        address producer,
        uint256 depositAmount,
        uint256 insurancePrice,
        uint256 totalPolicies,
        uint256 soldPolicies,
        bytes32 questionId,
        bool resolved,
        bool delayed
    ) {
        Flight storage flight = flights[flightId];
        return (
            flight.producer,
            flight.depositAmount,
            flight.insurancePrice,
            flight.totalPolicies,
            flight.soldPolicies,
            flight.questionId,
            flight.resolved,
            flight.delayed
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
}