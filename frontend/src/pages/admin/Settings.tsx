import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface SystemSettings {
  wifiMacAddresses: string[];
  localNetworkSubnet: string;
  backupSettings: {
    enabled: boolean;
    frequency: string;
    retentionDays: number;
  };
  systemSettings: {
    appName: string;
    version: string;
    debugMode: boolean;
  };
}

const AdminSettings: React.FC = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<SystemSettings>({
    wifiMacAddresses: [],
    localNetworkSubnet: '192.168.1.0/24',
    backupSettings: {
      enabled: true,
      frequency: 'daily',
      retentionDays: 30
    },
    systemSettings: {
      appName: 'Staff Attendance & Payout System',
      version: '1.0.0',
      debugMode: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMacAddress, setNewMacAddress] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // This would need API endpoints for settings
      // For now, we'll use default values
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      // This would need API endpoints for saving settings
      console.log('Saving settings:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const addMacAddress = () => {
    if (newMacAddress.trim()) {
      setSettings({
        ...settings,
        wifiMacAddresses: [...settings.wifiMacAddresses, newMacAddress.trim()]
      });
      setNewMacAddress('');
    }
  };

  const removeMacAddress = (index: number) => {
    setSettings({
      ...settings,
      wifiMacAddresses: settings.wifiMacAddresses.filter((_, i) => i !== index)
    });
  };

  const testBackup = async () => {
    try {
      // This would need API endpoint for testing backup
      console.log('Testing backup...');
    } catch (error) {
      console.error('Backup test failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600">Configure system settings and security options</p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* WiFi MAC Address Configuration */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                WiFi MAC Address Configuration
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure allowed WiFi MAC addresses for attendance verification
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Local Network Subnet
                  </label>
                  <input
                    type="text"
                    value={settings.localNetworkSubnet}
                    onChange={(e) => setSettings({
                      ...settings,
                      localNetworkSubnet: e.target.value
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="192.168.1.0/24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Add MAC Address
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMacAddress}
                      onChange={(e) => setNewMacAddress(e.target.value)}
                      className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="AA:BB:CC:DD:EE:FF"
                    />
                    <button
                      onClick={addMacAddress}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Configured MAC Addresses
                  </label>
                  <div className="space-y-2">
                    {settings.wifiMacAddresses.map((mac, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <span className="text-sm font-mono text-gray-900">{mac}</span>
                        <button
                          onClick={() => removeMacAddress(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {settings.wifiMacAddresses.length === 0 && (
                      <p className="text-gray-500 text-sm">No MAC addresses configured</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Settings */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Backup Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.backupSettings.enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      backupSettings: {
                        ...settings.backupSettings,
                        enabled: e.target.checked
                      }
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable automatic backups
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Backup Frequency
                  </label>
                  <select
                    value={settings.backupSettings.frequency}
                    onChange={(e) => setSettings({
                      ...settings,
                      backupSettings: {
                        ...settings.backupSettings,
                        frequency: e.target.value
                      }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Retention Period (Days)
                  </label>
                  <input
                    type="number"
                    value={settings.backupSettings.retentionDays}
                    onChange={(e) => setSettings({
                      ...settings,
                      backupSettings: {
                        ...settings.backupSettings,
                        retentionDays: parseInt(e.target.value)
                      }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    min="1"
                    max="365"
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={testBackup}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Test Backup
                  </button>
                  <button
                    onClick={() => console.log('Create manual backup')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Create Manual Backup
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                System Settings
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Application Name
                  </label>
                  <input
                    type="text"
                    value={settings.systemSettings.appName}
                    onChange={(e) => setSettings({
                      ...settings,
                      systemSettings: {
                        ...settings.systemSettings,
                        appName: e.target.value
                      }
                    })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Version
                  </label>
                  <input
                    type="text"
                    value={settings.systemSettings.version}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.systemSettings.debugMode}
                    onChange={(e) => setSettings({
                      ...settings,
                      systemSettings: {
                        ...settings.systemSettings,
                        debugMode: e.target.checked
                      }
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Enable debug mode
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Save Settings */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => fetchSettings()}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Reset
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;