const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const cors = require('cors');
//const cron = require('node-cron');

const sequelize = new Sequelize('voting_system', 'ayush', 'ayushyadav', {
  host: 'localhost',
  dialect: 'postgres',
});
const app = express();

app.use(express.json());
app.use(cors());

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

    // Dynamically create a new table for the election
    const electionTableName = `election_${newElection.election_id}`;
    await sequelize.query(`
      CREATE TABLE ${electionTableName} (
        candidate_id SERIAL PRIMARY KEY,
        candidate_name VARCHAR(255) NOT NULL,
        candidate_party VARCHAR(255) NOT NULL
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

// Schedule a task to run every minute
/* cron.schedule('* * * * *', async () => {
  console.log('Checking for elections to update status...');
  try {
    // Get the current time
    const now = new Date();

    // Find elections whose end time has passed and are still active
    const electionsToUpdate = await Election.findAll({
      where: {
        end_datetime: { [sequelize.Op.lte]: now }, // End time is less than or equal to now
        status: 'active', // Only update active elections
      },
    });

    // Update the status of these elections to 'completed'
    for (const election of electionsToUpdate) {
      election.status = 'completed';
      await election.save();
      console.log(`Updated election ID ${election.election_id} to completed.`);
    }
  } catch (error) {
    console.error('Error updating election statuses:', error);
  }
}); */

app.listen(5000, () => console.log('Server running on port 5000'));