import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const VotePage = () => {
  const { voterId, electionId } = useParams();
  const [voterDetails, setVoterDetails] = useState({});
  const [electionDetails, setElectionDetails] = useState({});
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVoterDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/voters/${voterId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch voter details');
        }
        setVoterDetails(data.voter); // Use only the voter part of the response
      } catch (err) {
        console.error('Error fetching voter details:', err.message);
        setError(err.message);
      }
    };

    const fetchElectionDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/elections/${electionId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch election details');
        }
        setElectionDetails(data.election);
        setCandidates(data.candidates);
      } catch (err) {
        console.error('Error fetching election details:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVoterDetails();
    fetchElectionDetails();
  }, [voterId, electionId]);

  const handleVote = async () => {
    if (!selectedCandidate) {
      alert('Please select a candidate to vote for.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/castvote/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId,
          electionId,
          candidateId: selectedCandidate,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cast vote');
      }

      alert('Vote cast successfully!');
      navigate(`/voter/${voterId}`);
    } catch (err) {
      console.error('Error casting vote:', err.message);
      alert('Failed to cast vote. Please try again.');
    }
  };

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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{electionDetails.election_name}</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Candidates</h2>
        <ul className="space-y-4">
          {candidates.map((candidate) => (
            <li
              key={candidate.candidate_id}
              className={`p-4 bg-white rounded-lg shadow-md hover:shadow-lg cursor-pointer ${
                selectedCandidate === candidate.candidate_id ? 'border-2 border-blue-500' : ''
              }`}
              onClick={() => setSelectedCandidate(candidate.candidate_id)}
            >
              <h2 className="text-xl font-bold">{candidate.candidate_name}</h2>
              <p className="text-gray-600">
                <strong>Party:</strong> {candidate.candidate_party}
              </p>
              <p className="text-sm text-gray-500">
                <strong>ID:</strong> {candidate.candidate_id}
              </p>
            </li>
          ))}
        </ul>
        <button
          onClick={handleVote}
          className="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Cast Vote
        </button>
      </div>
    </div>
  );
};

export default VotePage;