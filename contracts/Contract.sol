// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract BlockchainVoting {
    
    address public owner;
    struct Election {
        bool isActive;
        uint256[] candidateIds;
        mapping(bytes32 => bool) hasVoted;
        mapping(uint256 => uint256) votesPerCandidate;
    }

    mapping(uint256 => Election) private elections;
    uint256[] public allElections; //For frontend to fetch all elections

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    //Events for frontend interaction
    event ElectionCreated(uint256 electionId, uint256[] candidateIds);
    event ElectionToggled(uint256 electionId, bool isActive);
    event Voted(uint256 electionId, uint256 candidateId, address voter);

    constructor() {
        owner = msg.sender;
    }

    //Create new election
    function createElection(uint256 electionId, uint256[] calldata candidateIds) external onlyOwner {
        require(elections[electionId].candidateIds.length == 0, "Election already exists");

        for (uint i = 0; i < candidateIds.length; i++) {
            elections[electionId].candidateIds.push(candidateIds[i]);
        }

        elections[electionId].isActive = false;
        allElections.push(electionId); // Track all election IDs

        emit ElectionCreated(electionId, candidateIds);
    }

    //Start or end an election
    function toggleElection(uint256 electionId) external onlyOwner {
        require(elections[electionId].candidateIds.length > 0, "Election does not exist");
        elections[electionId].isActive = !elections[electionId].isActive;

        emit ElectionToggled(electionId, elections[electionId].isActive);
    }

    //Vote for a candidate (frontend will pass plain voter ID)
    function vote(uint256 electionId, uint256 candidateId, string memory voterId) external {
        require(elections[electionId].isActive, "Election is not active");

        bytes32 hashedVoterID = keccak256(abi.encodePacked(voterId));
        require(!elections[electionId].hasVoted[hashedVoterID], "Already voted");

        elections[electionId].hasVoted[hashedVoterID] = true;
        elections[electionId].votesPerCandidate[candidateId]++;

        emit Voted(electionId, candidateId, msg.sender);
    }

    //View full election results (for admin)
    function viewResults(uint256 electionId) external view onlyOwner returns (uint256[] memory, uint256[] memory) {
        Election storage election = elections[electionId];
        uint256 len = election.candidateIds.length;

        uint256[] memory voteCounts = new uint256[](len);
        for (uint i = 0; i < len; i++) {
            uint256 candidateId = election.candidateIds[i];
            voteCounts[i] = election.votesPerCandidate[candidateId];
        }

        return (election.candidateIds, voteCounts);
    }

    //Check if a voter has voted in an election
    function hasVoted(uint256 electionId, bytes32 hashedVoterID) external view returns (bool) {
        return elections[electionId].hasVoted[hashedVoterID];
    }

    //Check if an election is active
    function isElectionActive(uint256 electionId) external view returns (bool) {
        return elections[electionId].isActive;
    }

    //Get total elections created (frontend-friendly)
    function getAllElectionIds() external view returns (uint256[] memory) {
        return allElections;
    }
}