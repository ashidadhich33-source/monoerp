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
      const response = await api.get('/setup/status');
      setIsSetupComplete(response.data.is_setup_complete);
    } catch (error) {
      console.error('Error checking setup status:', error);
      setError('Failed to check setup status');
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
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Check Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={checkSetupStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
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