// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IRealityERC20 {
    function askQuestion(
        uint32 templateId,
        string calldata question,
        address arbitrator,
        uint32 timeout,
        uint32 openingTs,
        bytes32 nonce
    ) external returns (bytes32 questionId);

    function submitAnswer(bytes32 questionId, bytes32 answer, uint256 bond) external;

    function finalize(bytes32 questionId) external;

    function resultFor(bytes32 questionId) external view returns (bytes32);

    function getFinalAnswerIfMatches(
        bytes32 questionId,
        bytes32 contentHash,
        address arbitrator,
        uint32 minTimeout,
        uint256 minBond
    ) external view returns (bytes32);

    function claimWinnings(bytes32 questionId) external;

    event LogNewQuestion(
        bytes32 indexed questionId,
        address indexed asker,
        uint32 templateId,
        string question,
        bytes32 contentHash,
        address arbitrator,
        uint32 timeout,
        uint32 openingTs,
        bytes32 nonce,
        uint256 createdTs
    );

    event LogNewAnswer(
        bytes32 indexed questionId, 
        bytes32 indexed answer, 
        address indexed answerer, 
        uint256 bond, 
        uint256 ts
    );

    event LogFinalize(bytes32 indexed questionId, bytes32 indexed answer);
}