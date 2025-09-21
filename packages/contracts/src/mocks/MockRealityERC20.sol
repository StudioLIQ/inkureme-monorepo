// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {IRealityERC20} from "../interfaces/IRealityERC20.sol";

contract MockRealityERC20 is IRealityERC20 {
    mapping(bytes32 => bytes32) private _answers;
    mapping(bytes32 => bool) private _finalized;

    function askQuestion(
        uint32 /*templateId*/,
        string calldata question,
        address /*arbitrator*/,
        uint32 /*timeout*/,
        uint32 /*openingTs*/,
        bytes32 nonce
    ) external override returns (bytes32 questionId) {
        questionId = keccak256(abi.encodePacked(question, nonce, block.timestamp, msg.sender));
        emit LogNewQuestion(questionId, msg.sender, 0, question, bytes32(0), address(0), 0, 0, nonce, block.timestamp);
    }

    function submitAnswer(bytes32 questionId, bytes32 answer, uint256 /*bond*/) external override {
        _answers[questionId] = answer;
        emit LogNewAnswer(questionId, answer, msg.sender, 0, block.timestamp);
    }

    function finalize(bytes32 questionId) external override {
        _finalized[questionId] = true;
        emit LogFinalize(questionId, _answers[questionId]);
    }

    function resultFor(bytes32 questionId) external view override returns (bytes32) {
        if (_finalized[questionId]) return _answers[questionId];
        return bytes32(0);
    }

    function getFinalAnswerIfMatches(
        bytes32 questionId,
        bytes32 /*contentHash*/,
        address /*arbitrator*/,
        uint32 /*minTimeout*/,
        uint256 /*minBond*/
    ) external view override returns (bytes32) {
        return _finalized[questionId] ? _answers[questionId] : bytes32(0);
    }

    function claimWinnings(bytes32 /*questionId*/) external pure override {}
}

