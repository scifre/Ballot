import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const VoterDashboard = () => {
  const { voterId } = useParams();
  const [elections, setElections] = useState([]);
  const [voterDetails, setVoterDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('available'); // Add state for active tab
  const [expandedElection, setExpandedElection] = useState(null); // Track expanded election results
  const [results, setResults] = useState({}); // Store results for expanded elections
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVoterData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/voters/${voterId}`); // Fetch voter and election details
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch voter data');
        }
        setVoterDetails(data.voter);
        setElections(data.elections);
      } catch (err) {
        console.error('Error fetching voter data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVoterData();
  }, [voterId]);

  // Fetch results for a specific election
  const fetchResults = async (electionId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/election/results/${electionId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch election results');
      }
      setResults((prevResults) => ({
        ...prevResults,
        [electionId]: data.results,
      }));
    } catch (err) {
      console.error('Error fetching election results:', err.message);
      setError(err.message);
    }
  };

  // Toggle the expanded state of an election card
  const toggleExpandElection = (electionId) => {
    if (expandedElection === electionId) {
      setExpandedElection(null); // Collapse if already expanded
    } else {
      setExpandedElection(electionId); // Expand the selected election
      if (!results[electionId]) {
        fetchResults(electionId); // Fetch results if not already fetched
      }
    }
  };

  // Filter elections based on status
  const availableElections = elections.filter(election => election.status !== 'voted' && election.status !== 'completed');
  const votedElections = elections.filter(election => election.status === 'voted');
  const completedElections = elections.filter(election => election.status === 'completed');

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-64 bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold mb-6">Voter Profile</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-400 text-sm">Name</p>
            <p className="font-medium">{voterDetails.name || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Voter ID</p>
            <p className="font-medium">{voterDetails.voter_id || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Gender</p>
            <p className="font-medium">{voterDetails.gender || 'Loading...'}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Age</p>
            <p className="font-medium">{voterDetails.age || 'Loading...'}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 w-full p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Welcome, {voterDetails.name}</h1>
        
        {/* Tabs */}
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'available' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => setActiveTab('available')}
          >
            Available Elections
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'voted' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => setActiveTab('voted')}
          >
            Voted Elections
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              activeTab === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Elections
          </button>
        </div>

        {/* Elections List */}
        {activeTab === 'available' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Elections</h2>
            {availableElections.length > 0 ? (
              <ul className="space-y-4">
                {availableElections.map((election) => (
                  <li
                    key={election.election_id}
                    className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg cursor-pointer"
                    onClick={() => navigate(`/voter/${voterId}/vote/${election.election_id}`)} // Navigate to VotePage
                  >
                    <h2 className="text-xl font-bold">{election.election_name}</h2>
                    <p className="text-gray-600">
                      <strong>Start Date:</strong> {new Date(election.start_date).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>End Date:</strong> {new Date(election.end_date).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>Status:</strong> {election.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No elections available for voting.</p>
            )}
          </>
        )}

        {activeTab === 'voted' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Voted Elections</h2>
            {votedElections.length > 0 ? (
              <ul className="space-y-4">
                {votedElections.map((election) => (
                  <li
                    key={election.election_id}
                    className="p-4 bg-white rounded-lg shadow-md"
                  >
                    <h2 className="text-xl font-bold">{election.election_name}</h2>
                    <p className="text-gray-600">
                      <strong>Start Date:</strong> {new Date(election.start_date).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>End Date:</strong> {new Date(election.end_date).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>Status:</strong> {election.status}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No elections voted.</p>
            )}
          </>
        )}

        {activeTab === 'completed' && (
          <>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Completed Elections</h2>
            {completedElections.length > 0 ? (
              <ul className="space-y-4">
                {completedElections.map((election) => (
                  <li
                    key={election.election_id}
                    className="p-4 bg-white rounded-lg shadow-md"
                  >
                    <h2 className="text-xl font-bold">{election.election_name}</h2>
                    <p className="text-gray-600">
                      <strong>Start Date:</strong> {new Date(election.start_date).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>End Date:</strong> {new Date(election.end_date).toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      <strong>Status:</strong> {election.status}
                    </p>
                    <button
                      onClick={() => toggleExpandElection(election.election_id)}
                      className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                      {expandedElection === election.election_id ? 'Hide Result' : 'View Result'}
                    </button>
                    {expandedElection === election.election_id && results[election.election_id] && (
                      <div className="mt-4">
                        <h3 className="text-lg font-bold mb-2">Results</h3>
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr>
                              <th className="border border-gray-300 p-2">Candidate Name</th>
                              <th className="border border-gray-300 p-2">Party</th>
                              <th className="border border-gray-300 p-2">Vote Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results[election.election_id].map((candidate) => (
                              <tr key={candidate.candidate_id}>
                                <td className="border border-gray-300 p-2">{candidate.candidate_name}</td>
                                <td className="border border-gray-300 p-2">{candidate.candidate_party}</td>
                                <td className="border border-gray-300 p-2">{candidate.votes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No completed elections.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VoterDashboard;