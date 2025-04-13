import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const VoterDashboard = () => {
  const { voterId } = useParams(); // Fetch voterId from the URL
  const [elections, setElections] = useState([]);
  const [voterDetails, setVoterDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Available Elections</h2>
        {elections.length > 0 ? (
          <ul className="space-y-4">
            {elections.map((election) => (
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
      </div>
    </div>
  );
};

export default VoterDashboard;