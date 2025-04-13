import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const ElectionPage = () => {
  const { electionId } = useParams(); // Get the election ID from the URL
  const [electionDetails, setElectionDetails] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      } catch (err) {
        console.error('Error fetching election data:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchElectionDetails();
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

      <h2 className="text-xl font-bold mb-4">Candidates</h2>
      <div className="bg-white p-6 rounded-lg shadow-md">
        {candidates.length > 0 ? (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Candidate ID</th>
                <th className="border border-gray-300 p-2">Candidate Name</th>
                <th className="border border-gray-300 p-2">Candidate Party</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.candidate_id}>
                  <td className="border border-gray-300 p-2">{candidate.candidate_id}</td>
                  <td className="border border-gray-300 p-2">{candidate.candidate_name}</td>
                  <td className="border border-gray-300 p-2">{candidate.candidate_party}</td>
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