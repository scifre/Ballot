import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('active'); // State to track the active tab
  const [activeElections, setActiveElections] = useState([]); // State to store active elections
  const [completedElections, setCompletedElections] = useState([]); // State to store completed elections
  const [loading, setLoading] = useState(false); // State to track loading
  const [error, setError] = useState(''); // State to track errors
  const navigate = useNavigate(); // Hook to navigate programmatically

  // Form state for creating a new election
  const [newElection, setNewElection] = useState({
    name: '',
    endDate: '',
    candidates: [{ name: '', party: '' }], // Each candidate has a name and party
  });

  // Fetch Active and Completed Elections from the database
  useEffect(() => {
    if (activeTab === 'active') {
      fetchElections('active');
    } else if (activeTab === 'completed') {
      fetchElections('completed');
    }
  }, [activeTab]);

  const fetchElections = async (type) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/admin/elections?type=${type}`);
      const data = await response.json();

      if (response.ok) {
        if (type === 'active') {
          setActiveElections(data.elections);
        } else {
          setCompletedElections(data.elections);
        }
      } else {
        setError(data.message || 'Failed to fetch elections');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleNewElectionChange = (e) => {
    const { name, value } = e.target;
    setNewElection((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCandidateChange = (index, field, value) => {
    const updatedCandidates = [...newElection.candidates];
    updatedCandidates[index][field] = value; // Update the specific field (name or party)
    setNewElection((prev) => ({
      ...prev,
      candidates: updatedCandidates,
    }));
  };

  const addCandidateField = () => {
    setNewElection((prev) => ({
      ...prev,
      candidates: [...prev.candidates, { name: '', party: '' }],
    }));
  };

  const removeCandidateField = (index) => {
    const updatedCandidates = newElection.candidates.filter((_, i) => i !== index);
    setNewElection((prev) => ({
      ...prev,
      candidates: updatedCandidates,
    }));
  };

  const handleNewElectionSubmit = async (e) => {
    e.preventDefault();

    // Prepare the payload for the backend
    const payload = {
      name: newElection.name, // Election name
      endDate: newElection.endDate, // End date
      candidates: newElection.candidates.map((candidate) => ({
        name: candidate.name,
        party: candidate.party,
      })), // Candidates with their respective names and parties
    };

    try {
      const response = await fetch('http://localhost:5000/api/admin/new_election', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send the payload to the backend
      });

      const data = await response.json();

      if (response.ok) {
        alert('Election created successfully!');
        setNewElection({ name: '', endDate: '', candidates: [{ name: '', party: '' }] }); // Reset form
        setActiveTab('active'); // Switch to active elections tab
        fetchElections('active'); // Refresh active elections
      } else {
        alert(data.message || 'Failed to create election');
      }
    } catch (err) {
      alert('Network error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          }`}
          onClick={() => setActiveTab('active')}
        >
          Active Elections
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          }`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Elections
        </button>
        <button
          className={`px-4 py-2 rounded-md ${
            activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          }`}
          onClick={() => {
            setActiveTab('create');
            console.log('Active Tab:', 'create'); // Debugging log
          }}
        >
          Create New Election
        </button>
      </div>

      {/* Content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : activeTab === 'active' ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Active Elections</h2>
            {activeElections.length > 0 ? (
              <ul className="space-y-4">
                {activeElections.map((election) => (
                  <li
                    key={election.election_id}
                    className="p-4 border border-gray-300 rounded-md hover:shadow-md cursor-pointer"
                    onClick={() => navigate(`/elections/${election.election_id}`)} // Navigate to election page
                  >
                    <h3 className="text-lg font-bold">{election.election_name}</h3>
                    <p className="text-gray-600"><strong>Election ID:</strong> {election.election_id}</p>
                    <p className="text-gray-600"><strong>Status:</strong> {election.status}</p>
                    <p className="text-gray-600"><strong>Start Date:</strong> {new Date(election.start_datetime).toLocaleString()}</p>
                    <p className="text-gray-600"><strong>End Date:</strong> {new Date(election.end_datetime).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No active elections found.</p>
            )}
          </div>
        ) : activeTab === 'completed' ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Completed Elections</h2>
            {completedElections.length > 0 ? (
              <ul className="space-y-4">
                {completedElections.map((election) => (
                  <li
                    key={election.election_id}
                    className="p-4 border border-gray-300 rounded-md hover:shadow-md cursor-pointer"
                    onClick={() => navigate(`/elections/${election.election_id}`)} // Navigate to election page
                  >
                    <h3 className="text-lg font-bold">{election.election_name}</h3>
                    <p className="text-gray-600"><strong>Election ID:</strong> {election.election_id}</p>
                    <p className="text-gray-600"><strong>Status:</strong> {election.status}</p>
                    <p className="text-gray-600"><strong>Start Date:</strong> {new Date(election.start_datetime).toLocaleString()}</p>
                    <p className="text-gray-600"><strong>End Date:</strong> {new Date(election.end_datetime).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No completed elections found.</p>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold mb-4">Create New Election</h2>
            <form onSubmit={handleNewElectionSubmit}>
              <div className="mb-4">
                <label className="text-xl block text-gray-700">Election Name</label>
                <input
                  type="text"
                  name="name"
                  value={newElection.name}
                  onChange={handleNewElectionChange}
                  className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-xl block text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={newElection.endDate}
                  onChange={handleNewElectionChange}
                  className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="text-xl block text-gray-700">Add Candidates</label>
                {newElection.candidates.map((candidate, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded-md">
                    <div className="flex items-center space-x-4">
                      {/* Candidate Name Input */}
                      <div className="flex-1">
                        <label className="block text-gray-700 mb-1">Candidate Name</label>
                        <input
                          type="text"
                          placeholder="Candidate Name"
                          value={candidate.name}
                          onChange={(e) => handleCandidateChange(index, 'name', e.target.value)}
                          className="p-2 border border-gray-300 rounded-md w-full"
                          required
                        />
                      </div>
                      {/* Candidate Party Input */}
                      <div className="flex-1">
                        <label className="block text-gray-700 mb-1">Candidate Party</label>
                        <input
                          type="text"
                          placeholder="Party Name"
                          value={candidate.party}
                          onChange={(e) => handleCandidateChange(index, 'party', e.target.value)}
                          className="p-2 border border-gray-300 rounded-md w-full"
                          required
                        />
                      </div>
                      {/* Remove Candidate Button */}
                      {newElection.candidates.length > 1 && (
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => removeCandidateField(index)}
                            className="p-2 bg-red-500 text-white rounded-md"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCandidateField}
                  className="mt-2 p-2 bg-blue-500 text-white rounded-md"
                >
                  Add Candidate
                </button>
              </div>
              <button
                type="submit"
                className="mt-4 p-2 bg-green-500 text-white rounded-md"
              >
                Create Election
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;