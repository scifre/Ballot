import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const LoginPage = () => {
  const [formData, setFormData] = useState({
    voterID: '', // Changed from email to voterID
    password: '',
    rememberMe: false,
  });

  const [isSignUp, setIsSignUp] = useState(false); // State to toggle between login and signup
  const [responseMessage, setResponseMessage] = useState(''); // State to store the response message
  const navigate = useNavigate(); // Hook to programmatically navigate
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isSignUp
      ? 'http://localhost:5000/api/signup'
      : 'http://localhost:5000/api/login'; // Adjust the endpoint based on the action
    const payload = {
      voter_id: formData.voterID, // Send voterID as a string
      password: formData.password,
    };

    if (isSignUp) {
      payload.name = formData.name; // Add name to the payload
      payload.gender = formData.gender; // Add gender to the payload
      payload.age = formData.age; // Add age to the payload
      payload.confirmPassword = formData.confirmPassword; // Include confirmPassword for signup
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage(data.message); // Set success message
        console.log('Success:', data);
        if (data.role === 'admin') {
          navigate('/admin'); // Redirect to admin dashboard on success
        } else if (data.role === 'voter') {
          navigate(`/voter/${formData.voterID}`); // Redirect to voter dashboard with voterId in the URL
          console.log('Voter login'); // Log voter login
        }
          // Handle successful login/signup (e.g., redirect, show success message)
      } else {
        setResponseMessage(data.message || 'Something went wrong'); // Set error message
        console.error('Error:', data.message || 'Something went wrong');
      }
    } catch (error) {
      setResponseMessage('Network Error'); // Set network error message
      console.error('Network Error:', error);
    }

    console.log('Form submitted:', formData);
  };

  return (
    <div className="bg-gray-100 h-screen flex items-center justify-center">
      <div className="flex w-full max-w-6xl">
        {/* Left Section for Product Information */}
        <div className="w-1/2 flex flex-col justify-center pr-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Ballot</h1>
          <p className="text-gray-600 text-lg">
            eVoting is a secure and transparent blockchain-based voting platform. 
            It ensures integrity, anonymity, and trust in the voting process. 
            Join us to experience the future of voting.
          </p>
        </div>

        {/* Right Section for Login/Signup Form */}
        <div className="w-1/2 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {isSignUp ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isSignUp ? 'Please fill in the details to create an account' : 'Please sign in to your account'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="voterID" className="block text-sm font-medium text-gray-700 mb-2">
                Voter ID
              </label>
              <input
                type="text" // Changed from number to text
                id="voterID"
                name="voterID"
                value={formData.voterID}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your Voter ID"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {isSignUp && (
              <div className="mb-6">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {isSignUp && (
              <>
                <div className="mb-6">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="" disabled>
                      Select your gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="mb-6">
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={formData.age || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your age"
                    required
                    min="18"
                  />
                </div>
              </>
            )}

            

            {!isSignUp && (
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {/* Display the response message */}
          {responseMessage && (
            <div className="mt-4 text-center">
              <p className="text-sm text-red-600">{responseMessage}</p>
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-600 hover:text-blue-800 font-medium ml-1"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;