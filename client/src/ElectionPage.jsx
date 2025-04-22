import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ElectionPage = () => {
  const { electionId } = useParams(); // Get the election ID from the URL
  const [electionDetails, setElectionDetails] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voteCounts, setVoteCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEnding, setIsEnding] = useState(false); // State for ending the election

  // Fetch vote counts
  const fetchVoteCounts = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch(`http://localhost:5000/api/admin/election/updateCount/${electionId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch vote counts');
      }

      // Create a map of candidate ID to vote count
      const countsMap = {};
      data.results.forEach(result => {
        countsMap[result.candidate_id] = result.vote_count;
      });
      setVoteCounts(countsMap);
    } catch (err) {
      console.error('Error fetching vote counts:', err.message);
      setError(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // End election and declare result
  const endElection = async () => {
    try {
      setIsEnding(true);
      const response = await fetch(`http://localhost:5000/api/election/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ electionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to end election');
      }

      // Update election details to reflect the completed status
      setElectionDetails((prevDetails) => ({
        ...prevDetails,
        status: 'completed',
      }));

      alert('Election ended successfully and results declared!');
    } catch (err) {
      console.error('Error ending election:', err.message);
      setError(err.message);
    } finally {
      setIsEnding(false);
    }
  };

  useEffect(() => {
    const fetchElectionDetails = async () => {
      try {
        // Fetch election details and candidates from the combined API
        const response = await fetch(`http://localhost:5000/api/admin/elections/${electionId}`);
        const data = await response.json(); // Parse JSON response

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch election details');
        }

        // Set election details and candidates from the combined response
        setElectionDetails(data.election);
        setCandidates(data.candidates);
        
        // Fetch vote counts after getting election details
        await fetchVoteCounts();
      } catch (err) {
        console.error('Error fetching election data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchElectionDetails();

    // Set up polling for vote counts (every 30 seconds)
    const pollInterval = setInterval(fetchVoteCounts, 30000);

    // Cleanup polling on component unmount
    return () => clearInterval(pollInterval);
  }, [electionId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Election Details</h1>

      {electionDetails && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-bold mb-4">{electionDetails.election_name}</h2>
          <p><strong>Election ID:</strong> {electionDetails.election_id}</p>
          <p><strong>Start Date:</strong> {new Date(electionDetails.start_datetime).toLocaleString()}</p>
          <p><strong>End Date:</strong> {new Date(electionDetails.end_datetime).toLocaleString()}</p>
          <p><strong>Status:</strong> {electionDetails.status}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Candidates</h2>
        <div className="flex space-x-4">
          <button
            onClick={fetchVoteCounts}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-white font-semibold ${
              isUpdating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isUpdating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Vote Count'
            )}
          </button>
          <button
            onClick={endElection}
            disabled={isEnding || electionDetails?.status === 'completed'}
            className={`px-4 py-2 rounded-md text-white font-semibold ${
              isEnding || electionDetails?.status === 'completed'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isEnding ? 'Ending Election...' : 'End Election and Declare Result'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {candidates.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Candidate ID</th>
                <th className="border border-gray-300 p-2">Candidate Name</th>
                <th className="border border-gray-300 p-2">Candidate Party</th>
                <th className="border border-gray-300 p-2">Vote Count</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.candidate_id}>
                  <td className="border border-gray-300 p-2">{candidate.candidate_id}</td>
                  <td className="border border-gray-300 p-2">{candidate.candidate_name}</td>
                  <td className="border border-gray-300 p-2">{candidate.candidate_party}</td>
                  <td className="border border-gray-300 p-2">
                    <span className="font-semibold">
                      {voteCounts[candidate.candidate_id] || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No candidates found for this election.</p>
        )}
      </div>
    </div>
  );
};

export default ElectionPage;