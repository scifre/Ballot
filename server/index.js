const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const sequelize = new Sequelize('voting_system', 'ayush', 'ayushyadav', {
  host: 'localhost',
  dialect: 'postgres',
});
const app = express();

app.use(express.json());
app.use(cors());

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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "electionId",
        "type": "uint256"
      },
      { 
        "internalType": "uint256",
        "name": "candidateId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "hashedVoterId",
        "type": "bytes32"
      }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Load and verify private key
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is not set');
}

// Initialize provider and wallet with error handling
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const wallet = new ethers.Wallet(privateKey, provider);

// Log successful connection (optional)
console.log('Wallet connected successfully');

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

// Define the Voter model (linked to the 'voters' table)
const Voter = sequelize.define(
  'Voter',
  {
    voter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      primaryKey: true, // Mark voter_id as the primary key
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'voter', // Default role is 'voter'
    },
  },
  {
    tableName: 'voters', // Explicitly specify the table name
    timestamps: false, // Disable timestamps if not used in the table
  }
);

// Define the Election model
const Election = sequelize.define(
  'Election',
  {
    election_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    election_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    start_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_datetime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'elections',
    timestamps: false,
  }
);

// Login route
app.post('/api/login', async (req, res) => {
  const { voter_id, password } = req.body;

  if (!voter_id || !password) {
    return res.status(400).json({ message: 'voter_id and password are required' });
  }

  console.log('Received login request:', req.body);
  try {
    const voter = await Voter.findOne({ where: { voter_id } });

    if (!voter) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (voter.password === password) {
      if(voter.role === 'admin') {
        // Redirect to admin dashboard if the voter is an admin
        return res.status(200).json({ message: 'Login successful', role: 'admin' });
      }
      else if(voter.role === 'voter') {
        return res.status(200).json({ message: 'Login successful', role: 'voter' });
      } 
      
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Signup route
app.post('/api/signup', async (req, res) => {
  const { voter_id, password, confirmPassword, name, gender, age } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (!name || !gender || !age) {
    return res.status(400).json({ message: 'Name, gender, and age are required' });
  }

  try {
    const existingVoter = await Voter.findOne({ where: { voter_id } });

    if (existingVoter) {
      return res.status(400).json({ message: 'Voter already exists' });
    }

    // Add voter to the database
    await Voter.create({ voter_id, password, name, gender, age });

    // Dynamically create a new table for the voter
    const voterTableName = `voter_${voter_id}`;
    await sequelize.query(`
      CREATE TABLE ${voterTableName} (
        election_id INTEGER PRIMARY KEY,
        election_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL
      )
    `);

    res.status(201).json({ message: 'Signup successful and voter table created' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch elections based on type (active or completed)
app.get('/api/admin/elections', async (req, res) => {
  const { type } = req.query;

  try {
    let elections;
    if (type === 'active') {
      elections = await Election.findAll({
        where: {
          status: 'active',
        },
      });
    } else if (type === 'completed') {
      elections = await Election.findAll({
        where: {
          status: 'completed',
        },
      });
    } else {
      return res.status(400).json({ message: 'Invalid type parameter' });
    }

    res.status(200).json({ elections });
  } catch (error) {
    console.error('Error fetching elections:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create election route
app.post('/api/admin/new_election', async (req, res) => {
  const { name, endDate, candidates } = req.body;

  // Validate input
  if (!name || !endDate || !candidates || candidates.length === 0) {
    return res.status(400).json({ message: 'Election name, end date, and candidates are required' });
  }

  try {
    // Add the election to the database
    const newElection = await Election.create({
      election_name: name,
      start_datetime: new Date(), // Current timestamp
      end_datetime: new Date(endDate), // End date from the frontend
      status: 'active', // Default status
    });

    // Dynamically create a new table for the election with an additional 'votes' column
    const electionTableName = `election_${newElection.election_id}`;
    await sequelize.query(`
      CREATE TABLE ${electionTableName} (
        candidate_id SERIAL PRIMARY KEY,
        candidate_name VARCHAR(255) NOT NULL,
        candidate_party VARCHAR(255) NOT NULL,
        votes INTEGER DEFAULT 0
      )
    `);

    // Insert candidates into the newly created table
    for (const candidate of candidates) {
      await sequelize.query(`
        INSERT INTO ${electionTableName} (candidate_name, candidate_party)
        VALUES (:candidate_name, :candidate_party)
      `, {
        replacements: {
          candidate_name: candidate.name,
          candidate_party: candidate.party,
        },
      });
    }

    // Fetch all voter IDs where role is 'voter'
    const voters = await Voter.findAll({
      where: { role: 'voter' },
      attributes: ['voter_id'], // Only fetch voter_id
    });

    // Add the election details to each voter's table
    for (const voter of voters) {
      const voterTableName = `voter_${voter.voter_id}`;
      await sequelize.query(`
        INSERT INTO ${voterTableName} (election_id, election_name, status, start_date, end_date)
        VALUES (:election_id, :election_name, :status, :start_date, :end_date)
      `, {
        replacements: {
          election_id: newElection.election_id,
          election_name: newElection.election_name,
          status: newElection.status,
          start_date: newElection.start_datetime,
          end_date: newElection.end_datetime,
        },
      });
    }

    res.status(201).json({ message: 'Election and candidates created successfully, and election details added to all voter tables', election: newElection });
  } catch (error) {
    console.error('Error creating election:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch election details by ID
// Combined API to fetch both election details and candidates
app.get('/api/admin/elections/:electionId', async (req, res) => {
    const { electionId } = req.params;
    
    try {
      // Fetch election details from the database
      const election = await Election.findByPk(electionId);
      
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }
      
      // Fetch candidates from the dynamically created election table
      const electionTableName = `election_${electionId}`;
      let candidates = [];
      
      try {
        candidates = await sequelize.query(`SELECT * FROM ${electionTableName}`, {
          type: sequelize.QueryTypes.SELECT,
        });
      } catch (error) {
        // If table doesn't exist, we'll just return an empty candidates array
        console.error('Error fetching candidates:', error);
        // We won't fail the whole request, just note the issue
        if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
          candidates = [];
        }
      }
      
      // Return combined response with both election details and candidates
      res.status(200).json({
        election,
        candidates
      });
      
    } catch (error) {
      console.error('Error fetching election data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Fetch voter details by voter_id
app.get('/api/voters/:voterId', async (req, res) => {
  const { voterId } = req.params;

  try {
    // Fetch voter details from the voters table
    const voter = await Voter.findOne({
      where: { voter_id: voterId },
      attributes: ['voter_id', 'name', 'gender', 'age'], // Include only necessary fields
    });

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    // Fetch election details from the voter's specific table
    const voterTableName = `voter_${voterId}`;
    let elections = [];
    try {
      elections = await sequelize.query(`SELECT * FROM ${voterTableName}`, {
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      console.error(`Error fetching elections for voter ${voterId}:`, error);
      if (error.original && error.original.code === 'ER_NO_SUCH_TABLE') {
        return res.status(404).json({ message: `No election data found for voter ${voterId}` });
      }
      throw error;
    }

    // Return combined voter and election details
    res.status(200).json({ voter, elections });
  } catch (error) {
    console.error('Error fetching voter and election details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API to handle vote casting
app.post('/api/castvote/', async (req, res) => {
  const { voterId, electionId, candidateId } = req.body;

  if (!voterId || !electionId || !candidateId) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Hash the voterId before sending it to the smart contract
    const hashedVoterId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(voterId.toString()));

    // Call the smart contract function to cast the vote
    const tx = await contract.vote(electionId, candidateId, hashedVoterId);
    await tx.wait(); // Wait for the transaction to be mined

    // Update the election status in the voter's table
    const voterTableName = `voter_${voterId}`;
    await sequelize.query(
      `UPDATE ${voterTableName} SET status = 'voted' WHERE election_id = :electionId`,
      {
        replacements: { electionId },
        type: sequelize.QueryTypes.UPDATE,
      }
    );

    res.status(200).json({ 
      message: 'Vote cast successfully and status updated', 
      transactionHash: tx.hash 
    });
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ message: 'Failed to cast vote', error: error.message });
  }
});

// After your existing API endpoints, add:

app.get('/api/admin/election/updateCount/:electionId', async (req, res) => {
  const { electionId } = req.params;

  try {
    // Validate electionId
    const election = await Election.findByPk(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Get all VoteCast events for this election
    const filter = contract.filters.VoteCast(electionId);
    const events = await contract.queryFilter(filter);

    // Count votes for each candidate
    const voteCounts = {};

    // Process each voting event
    for (const event of events) {
      const candidateId = event.args.candidateId.toString();
      voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
    }

    // Get candidate details from the database
    const electionTableName = `election_${electionId}`;
    const candidates = await sequelize.query(
      `SELECT candidate_id, candidate_name, candidate_party FROM ${electionTableName}`,
      {
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Combine candidate details with vote counts
    const results = candidates.map(candidate => ({
      candidate_id: candidate.candidate_id,
      candidate_name: candidate.candidate_name,
      candidate_party: candidate.candidate_party,
      vote_count: voteCounts[candidate.candidate_id.toString()] || 0
    }));

    // Sort results by vote count in descending order
    results.sort((a, b) => b.vote_count - a.vote_count);

    // Update election status if needed
    const currentTime = new Date();
    if (currentTime > election.end_datetime && election.status !== 'completed') {
      await Election.update(
        { status: 'completed' },
        { where: { election_id: electionId } }
      );
    }

    res.status(200).json({
      election_id: electionId,
      election_name: election.election_name,
      status: election.status,
      results: results,
      total_votes: events.length
    });

  } catch (error) {
    console.error('Error updating vote count:', error);
    res.status(500).json({ 
      message: 'Failed to update vote count', 
      error: error.message 
    });
  }
});

app.post('/api/election/end', async (req, res) => {
  const { electionId } = req.body;

  if (!electionId) {
    return res.status(400).json({ message: 'Election ID is required' });
  }

  try {
    // Validate the election exists
    const election = await Election.findByPk(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if the election is already completed
    if (election.status === 'completed') {
      return res.status(400).json({ message: 'Election is already completed' });
    }

    // Fetch the latest vote counts from the blockchain
    const filter = contract.filters.VoteCast(electionId);
    const events = await contract.queryFilter(filter);

    // Count votes for each candidate
    const voteCounts = {};
    for (const event of events) {
      const candidateId = event.args.candidateId.toString();
      voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
    }

    // Update the election_{electionId} table with the latest vote counts
    const electionTableName = `election_${electionId}`;
    for (const [candidateId, voteCount] of Object.entries(voteCounts)) {
      await sequelize.query(
        `UPDATE ${electionTableName} SET votes = :voteCount WHERE candidate_id = :candidateId`,
        {
          replacements: { voteCount, candidateId },
          type: sequelize.QueryTypes.UPDATE,
        }
      );
    }

    // Update the election status to 'completed'
    await Election.update(
      { status: 'completed' },
      { where: { election_id: electionId } }
    );

    // Fetch all voter IDs where role is 'voter'
    const voters = await Voter.findAll({
      where: { role: 'voter' },
      attributes: ['voter_id'], // Only fetch voter_id
    });

    // Update the election status in each voter's table
    for (const voter of voters) {
      const voterTableName = `voter_${voter.voter_id}`;
      try {
        await sequelize.query(
          `UPDATE ${voterTableName} SET status = 'completed' WHERE election_id = :electionId`,
          {
            replacements: { electionId },
            type: sequelize.QueryTypes.UPDATE,
          }
        );
      } catch (error) {
        console.error(`Error updating table ${voterTableName}:`, error.message);
        // Continue updating other tables even if one fails
      }
    }

    res.status(200).json({ message: 'Election ended successfully, vote counts updated, and statuses updated' });
  } catch (error) {
    console.error('Error ending election:', error);
    res.status(500).json({ message: 'Failed to end election', error: error.message });
  }
});

app.get('/api/election/results/:electionId', async (req, res) => {
  const { electionId } = req.params;

  try {
    // Validate electionId
    const electionTableName = `election_${electionId}`;
    const results = await sequelize.query(
      `SELECT candidate_id, candidate_name, candidate_party, votes FROM ${electionTableName}`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'No results found for this election' });
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error('Error fetching election results:', error);
    res.status(500).json({ message: 'Failed to fetch election results', error: error.message });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});