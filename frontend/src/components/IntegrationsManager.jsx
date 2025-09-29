import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Cloud, 
  TestTube, 
  Send, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const IntegrationsManager = () => {
  const [integrations, setIntegrations] = useState({});
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});
  const [bulkSms, setBulkSms] = useState({ phoneNumbers: '', message: '' });
  const [bulkEmail, setBulkEmail] = useState({ 
    emailAddresses: '', 
    subject: '', 
    body: '', 
    htmlBody: '' 
  });

  useEffect(() => {
    loadIntegrations();
    loadProviders();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await apiService.getIntegrationStatus();
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      showErrorToast('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await apiService.getAvailableProviders();
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleTestIntegration = async (integrationName) => {
    try {
      setTesting(prev => ({ ...prev, [integrationName]: true }));
      const response = await apiService.testIntegration(integrationName);
      
      if (response.success) {
        showSuccessToast(`${integrationName} integration test passed`);
      } else {
        showErrorToast(`${integrationName} integration test failed: ${response.data.error}`);
      }
    } catch (error) {
      showErrorToast(`Failed to test ${integrationName} integration`);
    } finally {
      setTesting(prev => ({ ...prev, [integrationName]: false }));
    }
  };

  const handleSendBulkSms = async () => {
    try {
      const phoneNumbers = bulkSms.phoneNumbers.split('\n').filter(num => num.trim());
      if (phoneNumbers.length === 0) {
        showErrorToast('Please enter at least one phone number');
        return;
      }

      const response = await apiService.sendBulkSms(phoneNumbers, bulkSms.message);
      
      if (response.success) {
        showSuccessToast(`Bulk SMS sent: ${response.data.successful}/${response.data.total_sent} successful`);
        setBulkSms({ phoneNumbers: '', message: '' });
      } else {
        showErrorToast('Failed to send bulk SMS');
      }
    } catch (error) {
      showErrorToast('Failed to send bulk SMS');
    }
  };

  const handleSendBulkEmail = async () => {
    try {
      const emailAddresses = bulkEmail.emailAddresses.split('\n').filter(email => email.trim());
      if (emailAddresses.length === 0) {
        showErrorToast('Please enter at least one email address');
        return;
      }

      const response = await apiService.sendBulkEmail(
        emailAddresses, 
        bulkEmail.subject, 
        bulkEmail.body, 
        bulkEmail.htmlBody
      );
      
      if (response.success) {
        showSuccessToast(`Bulk email sent: ${response.data.successful}/${response.data.total_sent} successful`);
        setBulkEmail({ emailAddresses: '', subject: '', body: '', htmlBody: '' });
      } else {
        showErrorToast('Failed to send bulk email');
      }
    } catch (error) {
      showErrorToast('Failed to send bulk email');
    }
  };

  const getIntegrationIcon = (integrationName) => {
    switch (integrationName) {
      case 'sms': return <MessageSquare className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'payment': return <CreditCard className="w-5 h-5" />;
      case 'analytics': return <BarChart3 className="w-5 h-5" />;
      case 'backup': return <Cloud className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusIcon = (enabled, configured) => {
    if (enabled && configured) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (configured) {
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    } else {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusText = (enabled, configured) => {
    if (enabled && configured) {
      return 'Active';
    } else if (configured) {
      return 'Configured';
    } else {
      return 'Not Configured';
    }
  };

  const getStatusColor = (enabled, configured) => {
    if (enabled && configured) {
      return 'text-green-600';
    } else if (configured) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations Manager</h1>
          <p className="text-gray-600">Manage external API integrations and services</p>
        </div>
        <button
          onClick={loadIntegrations}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(integrations).map(([integrationName, config]) => (
          <div key={integrationName} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getIntegrationIcon(integrationName)}
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">{integrationName}</h3>
                  <p className="text-sm text-gray-600">{config.provider || 'Not configured'}</p>
                </div>
              </div>
              {getStatusIcon(config.enabled, config.configured)}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${getStatusColor(config.enabled, config.configured)}`}>
                  {getStatusText(config.enabled, config.configured)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Enabled</span>
                <span className={`text-sm ${config.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                  {config.enabled ? 'Yes' : 'No'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Configured</span>
                <span className={`text-sm ${config.configured ? 'text-green-600' : 'text-gray-600'}`}>
                  {config.configured ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => handleTestIntegration(integrationName)}
                disabled={!config.configured || testing[integrationName]}
                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testing[integrationName] ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4" />
                )}
                <span>Test</span>
              </button>
              
              <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                <Edit className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk SMS */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bulk SMS</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Numbers (one per line)
            </label>
            <textarea
              value={bulkSms.phoneNumbers}
              onChange={(e) => setBulkSms(prev => ({ ...prev, phoneNumbers: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="+1234567890&#10;+0987654321"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              value={bulkSms.message}
              onChange={(e) => setBulkSms(prev => ({ ...prev, message: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter your message here..."
            />
          </div>
          
          <button
            onClick={handleSendBulkSms}
            disabled={!bulkSms.phoneNumbers.trim() || !bulkSms.message.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Send Bulk SMS</span>
          </button>
        </div>
      </div>

      {/* Bulk Email */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Bulk Email</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Addresses (one per line)
            </label>
            <textarea
              value={bulkEmail.emailAddresses}
              onChange={(e) => setBulkEmail(prev => ({ ...prev, emailAddresses: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="user1@example.com&#10;user2@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={bulkEmail.subject}
              onChange={(e) => setBulkEmail(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email subject"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Body
            </label>
            <textarea
              value={bulkEmail.body}
              onChange={(e) => setBulkEmail(prev => ({ ...prev, body: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter your message here..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML Body (optional)
            </label>
            <textarea
              value={bulkEmail.htmlBody}
              onChange={(e) => setBulkEmail(prev => ({ ...prev, htmlBody: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Enter HTML content here..."
            />
          </div>
          
          <button
            onClick={handleSendBulkEmail}
            disabled={!bulkEmail.emailAddresses.trim() || !bulkEmail.subject.trim() || !bulkEmail.body.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>Send Bulk Email</span>
          </button>
        </div>
      </div>

      {/* Available Providers */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Available Providers</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(providers).map(([category, providerList]) => (
            <div key={category} className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 capitalize mb-2">{category}</h3>
              <div className="space-y-1">
                {providerList.map((provider) => (
                  <div key={provider} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">{provider}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsManager;