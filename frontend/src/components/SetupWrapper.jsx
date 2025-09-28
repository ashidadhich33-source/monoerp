import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Setup from '../pages/Setup';
import { apiService as api } from '../services/api';

const SetupWrapper = () => {
  const [isSetupComplete, setIsSetupComplete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      setError('');
      const response = await api.get('/setup/status');
      setIsSetupComplete(response.data.is_setup_complete);
    } catch (error) {
      console.error('Error checking setup status:', error);
      
      // Enhanced error handling
      if (error.response?.status === 500) {
        setError('Server error occurred. Please try again in a few moments.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Unable to connect to server. Please check your network connection.');
      } else {
        setError('Failed to check setup status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Check Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={checkSetupStatus}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              If the problem persists, please check your network connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSetupComplete) {
    return <Navigate to="/login" replace />;
  }

  return <Setup />;
};

export default SetupWrapper;