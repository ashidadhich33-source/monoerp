import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService as api } from '../services/api';

const Setup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Company data
    company: {
      name: '',
      address: '',
      phone: '',
      industry_type: '',
      timezone: 'UTC',
      currency: 'USD',
      working_hours_start: '09:00',
      working_hours_end: '17:00'
    },
    // Admin data
    admin: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      phone: ''
    }
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Industry types
  const industryTypes = [
    'Retail',
    'Manufacturing',
    'Services',
    'Healthcare',
    'Education',
    'Technology',
    'Finance',
    'Hospitality',
    'Construction',
    'Other'
  ];

  // Timezones
  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata'
  ];

  // Currencies
  const currencies = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'CHF',
    'CNY',
    'INR',
    'BRL'
  ];

  useEffect(() => {
    // Check if setup is already complete
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await api.get('/setup/status');
      if (response.data.is_setup_complete) {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking setup status:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Clear validation error for this field
    if (validationErrors[`${section}_${field}`]) {
      setValidationErrors(prev => ({
        ...prev,
        [`${section}_${field}`]: ''
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      // Validate company data
      if (!formData.company.name.trim()) {
        errors.company_name = 'Company name is required';
      }
      if (formData.company.name.trim().length < 2) {
        errors.company_name = 'Company name must be at least 2 characters';
      }
    }

    if (step === 2) {
      // Validate admin data
      if (!formData.admin.name.trim()) {
        errors.admin_name = 'Name is required';
      }
      if (formData.admin.name.trim().length < 2) {
        errors.admin_name = 'Name must be at least 2 characters';
      }
      if (!formData.admin.email.trim()) {
        errors.admin_email = 'Email is required';
      }
      if (!/\S+@\S+\.\S+/.test(formData.admin.email)) {
        errors.admin_email = 'Email is invalid';
      }
      if (!formData.admin.password) {
        errors.admin_password = 'Password is required';
      }
      if (formData.admin.password.length < 6) {
        errors.admin_password = 'Password must be at least 6 characters';
      }
      if (formData.admin.password !== formData.admin.confirm_password) {
        errors.admin_confirm_password = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/setup/complete', {
        company_data: formData.company,
        admin_data: {
          name: formData.admin.name,
          email: formData.admin.email,
          password: formData.admin.password,
          phone: formData.admin.phone
        },
        system_config: {}
      });

      if (response.data.success) {
        setSuccess('Setup completed successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(response.data.message || 'Setup failed. Please check your information and try again.');
      }
    } catch (error) {
      console.error('Setup error:', error);
      
      // Enhanced error handling with specific messages
      if (error.response?.status === 400) {
        setError('Invalid data provided. Please check all fields and try again.');
      } else if (error.response?.status === 409) {
        setError('Setup has already been completed. Please contact your administrator.');
      } else if (error.response?.status === 500) {
        setError('Server error occurred. Please try again in a few moments.');
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        setError('Unable to connect to server. Please check your network connection and try again.');
      } else {
        setError(error.response?.data?.detail || 'Setup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Information</h2>
        <p className="text-gray-600">Tell us about your company</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            value={formData.company.name}
            onChange={(e) => handleInputChange('company', 'name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.company_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter company name"
          />
          {validationErrors.company_name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.company_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Address
          </label>
          <textarea
            value={formData.company.address}
            onChange={(e) => handleInputChange('company', 'address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Enter company address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.company.phone}
              onChange={(e) => handleInputChange('company', 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry Type
            </label>
            <select
              value={formData.company.industry_type}
              onChange={(e) => handleInputChange('company', 'industry_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select industry type</option>
              {industryTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={formData.company.timezone}
              onChange={(e) => handleInputChange('company', 'timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={formData.company.currency}
              onChange={(e) => handleInputChange('company', 'currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Working Hours
            </label>
            <div className="flex space-x-2">
              <input
                type="time"
                value={formData.company.working_hours_start}
                onChange={(e) => handleInputChange('company', 'working_hours_start', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="flex items-center text-gray-500">to</span>
              <input
                type="time"
                value={formData.company.working_hours_end}
                onChange={(e) => handleInputChange('company', 'working_hours_end', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin User</h2>
        <p className="text-gray-600">Create your administrator account</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.admin.name}
            onChange={(e) => handleInputChange('admin', 'name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.admin_name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {validationErrors.admin_name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.admin_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.admin.email}
            onChange={(e) => handleInputChange('admin', 'email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              validationErrors.admin_email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
          />
          {validationErrors.admin_email && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.admin_email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.admin.phone}
            onChange={(e) => handleInputChange('admin', 'phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your phone number"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.admin.password}
              onChange={(e) => handleInputChange('admin', 'password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.admin_password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter password"
            />
            {validationErrors.admin_password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.admin_password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={formData.admin.confirm_password}
              onChange={(e) => handleInputChange('admin', 'confirm_password', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.admin_confirm_password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Confirm password"
            />
            {validationErrors.admin_confirm_password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.admin_confirm_password}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Complete</h2>
        <p className="text-gray-600">Review your information and complete setup</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Company Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {formData.company.name}</p>
            <p><span className="font-medium">Address:</span> {formData.company.address || 'Not provided'}</p>
            <p><span className="font-medium">Phone:</span> {formData.company.phone || 'Not provided'}</p>
            <p><span className="font-medium">Industry:</span> {formData.company.industry_type || 'Not specified'}</p>
            <p><span className="font-medium">Timezone:</span> {formData.company.timezone}</p>
            <p><span className="font-medium">Currency:</span> {formData.company.currency}</p>
            <p><span className="font-medium">Working Hours:</span> {formData.company.working_hours_start} - {formData.company.working_hours_end}</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin User</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {formData.admin.name}</p>
            <p><span className="font-medium">Email:</span> {formData.admin.email}</p>
            <p><span className="font-medium">Phone:</span> {formData.admin.phone || 'Not provided'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Staff Attendance & Payout System
          </h1>
          <p className="text-gray-600">Initial Setup</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    step < currentStep 
                      ? 'bg-green-600 text-white' 
                      : step === currentStep
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step < currentStep ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      step
                    )}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-2 ml-4 rounded-full transition-all duration-300 ${
                      step < currentStep ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-3 text-sm">
              <div className={`text-center ${currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                <div className="font-medium">Company</div>
                <div className="text-xs">Information</div>
              </div>
              <div className={`text-center ${currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                <div className="font-medium">Admin</div>
                <div className="text-xs">Account</div>
              </div>
              <div className={`text-center ${currentStep >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                <div className="font-medium">Complete</div>
                <div className="text-xs">Setup</div>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Setup Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Setup Complete</h3>
                  <p className="text-sm text-green-700 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-300 border-t-blue-600"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Setting up your system...</p>
                  <p className="text-xs text-blue-600 mt-1">This may take a few moments</p>
                </div>
              </div>
            </div>
          )}

          {/* Step Content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentStep === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;