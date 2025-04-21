// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EVoting {
    struct Vote {
        uint256 electionId;
        bytes32 hashedVoterId;
        uint256 candidateId;
        uint256 timestamp;
    }
    
    address public admin;
    
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, bytes32 hashedVoterId, uint256 timestamp);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    constructor() {
        admin = msg.sender;
    }
    
    function vote(uint256 electionId, uint256 candidateId, bytes32 hashedVoterId) external {
        uint256 timestamp = block.timestamp;
        emit VoteCast(electionId, candidateId, hashedVoterId, timestamp);
    }
}
