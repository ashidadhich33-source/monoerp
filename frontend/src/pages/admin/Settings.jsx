import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileLoading from '../../components/MobileLoading';

const AdminSettings = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
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
      const data = await apiService.getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await apiService.saveSystemSettings(settings);
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

  const removeMacAddress = (index) => {
    setSettings({
      ...settings,
      wifiMacAddresses: settings.wifiMacAddresses.filter((_, i) => i !== index)
    });
  };

  const testBackup = async () => {
    try {
      await apiService.testBackup();
    } catch (error) {
      console.error('Backup test failed:', error);
    }
  };

  const createManualBackup = async () => {
    try {
      await apiService.createBackup();
    } catch (error) {
      console.error('Manual backup failed:', error);
    }
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
              <p className="text-sm text-gray-600">Configure system settings and security options</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* WiFi MAC Address Configuration */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              WiFi MAC Address Configuration
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Configure allowed WiFi MAC addresses for attendance verification
            </p>
            
            <div className="space-y-4">
              <MobileInput
                label="Local Network Subnet"
                value={settings.localNetworkSubnet}
                onChange={(e) => setSettings({
                  ...settings,
                  localNetworkSubnet: e.target.value
                })}
                placeholder="192.168.1.0/24"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Add MAC Address
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMacAddress}
                    onChange={(e) => setNewMacAddress(e.target.value)}
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="AA:BB:CC:DD:EE:FF"
                  />
                  <MobileButton
                    onClick={addMacAddress}
                    variant="primary"
                    size="md"
                  >
                    Add
                  </MobileButton>
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
                      <MobileButton
                        onClick={() => removeMacAddress(index)}
                        variant="danger"
                        size="sm"
                      >
                        Remove
                      </MobileButton>
                    </div>
                  ))}
                  {settings.wifiMacAddresses.length === 0 && (
                    <p className="text-gray-500 text-sm">No MAC addresses configured</p>
                  )}
                </div>
              </div>
            </div>
          </MobileCard>

          {/* Backup Settings */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h3>
            
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <MobileInput
                label="Retention Period (Days)"
                type="number"
                value={settings.backupSettings.retentionDays}
                onChange={(e) => setSettings({
                  ...settings,
                  backupSettings: {
                    ...settings.backupSettings,
                    retentionDays: parseInt(e.target.value)
                  }
                })}
                min="1"
                max="365"
              />

              <div className="flex flex-wrap gap-2">
                <MobileButton
                  onClick={testBackup}
                  variant="success"
                  size="md"
                >
                  Test Backup
                </MobileButton>
                <MobileButton
                  onClick={createManualBackup}
                  variant="primary"
                  size="md"
                >
                  Create Manual Backup
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* System Settings */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
            
            <div className="space-y-4">
              <MobileInput
                label="Application Name"
                value={settings.systemSettings.appName}
                onChange={(e) => setSettings({
                  ...settings,
                  systemSettings: {
                    ...settings.systemSettings,
                    appName: e.target.value
                  }
                })}
              />

              <MobileInput
                label="Version"
                value={settings.systemSettings.version}
                disabled
                className="bg-gray-50"
              />

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
          </MobileCard>

          {/* Save Settings */}
          <MobileCard className="p-6">
            <div className="flex justify-end space-x-4">
              <MobileButton
                onClick={fetchSettings}
                variant="secondary"
                size="md"
              >
                Reset
              </MobileButton>
              <MobileButton
                onClick={saveSettings}
                disabled={saving}
                variant="primary"
                size="md"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </MobileButton>
            </div>
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;