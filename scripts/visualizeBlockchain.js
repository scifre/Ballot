const { ethers } = require("ethers");
require("dotenv").config();

// Load environment variables
const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; // Replace with your deployed contract address
const ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "electionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "hashedVoterId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "VoteCast",
    "type": "event"
  }
];

// Initialize provider and contract
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545"); // Replace with your RPC URL
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

async function startListening() {
  console.log("Listening for new VoteCast events...");

  // Listen for new VoteCast events
  contract.on("VoteCast", (electionId, candidateId, hashedVoterId, timestamp) => {
    const formattedTimestamp = new Date(timestamp.toNumber() * 1000).toLocaleString();

    console.log("New VoteCast Event Detected:");
    console.log(`  Election ID: ${electionId}`);
    console.log(`  Candidate ID: ${candidateId}`);
    console.log(`  Hashed Voter ID: ${hashedVoterId}`);
    console.log(`  Timestamp: ${formattedTimestamp}`);
    console.log("-----------------------------");

    // Optionally, append the new event to a JSON file
    const fs = require("fs");
    const newEvent = {
      electionId: electionId.toString(),
      candidateId: candidateId.toString(),
      hashedVoterId,
      timestamp: formattedTimestamp,
    };

    // Append the new event to the JSON file
    const filePath = "./blockchainVisualization.json";
    let existingData = [];
    if (fs.existsSync(filePath)) {
      existingData = JSON.parse(fs.readFileSync(filePath));
    }
    existingData.push(newEvent);
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));
    console.log("Event appended to 'blockchainVisualization.json'.");
  });
}

// Start listening for events
startListening();