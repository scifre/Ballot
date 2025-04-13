import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage.jsx';
import AdminDashboard from './Admin.jsx';
import ElectionPage from './ElectionPage.jsx';
import VoterDashboard from './VoterDashboard.jsx'; // Import VoterDashboard
import VotePage from './VotePage.jsx';
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/voter/:voterId" element={<VoterDashboard />} /> {/* Updated route */}
        <Route path="/elections/:electionId" element={<ElectionPage />} />
        <Route path="/voter/:voterId/vote/:electionId" element={<VotePage />} />
      </Routes>
    </Router>
  );
};

export default App;