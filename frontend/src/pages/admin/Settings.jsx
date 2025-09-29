import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileLoading from '../../components/MobileLoading';

const AdminSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      company_name: '',
      company_address: '',
      company_phone: '',
      company_email: '',
      timezone: 'UTC',
      currency: 'INR',
      working_hours_start: '09:00',
      working_hours_end: '17:00'
    },
    security: {
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_special_chars: true
      },
      session_timeout: 30,
      max_login_attempts: 5,
      lockout_duration: 15
    },
    notifications: {
      email_notifications: true,
      sms_notifications: false,
      attendance_alerts: true,
      salary_alerts: true,
      sales_alerts: true,
      backup_alerts: true
    },
    backup: {
      auto_backup: true,
      backup_frequency: 'daily',
      backup_time: '02:00',
      retention_days: 30,
      compress_backups: true
    },
    salary: {
      default_incentive_percentage: 5,
      advance_deduction_percentage: 10,
      salary_calculation_method: 'monthly',
      include_sundays: false
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await apiService.getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section, parent, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parent]: {
          ...prev[section][parent],
          [field]: value
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await apiService.updateSystemSettings(settings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      fetchSettings();
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
              <p className="text-sm text-gray-600">Configure system settings and preferences</p>
            </div>
            <div className="flex space-x-2">
              <MobileButton
                onClick={handleResetSettings}
                variant="secondary"
                size="md"
              >
                Reset
              </MobileButton>
              <MobileButton
                onClick={handleSaveSettings}
                variant="primary"
                size="md"
                disabled={saving}
                loading={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </MobileButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Tab Navigation */}
          <MobileCard className="p-0">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeTab === 'general'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  General
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeTab === 'security'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeTab === 'notifications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('backup')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeTab === 'backup'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Backup
                </button>
                <button
                  onClick={() => setActiveTab('salary')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeTab === 'salary'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Salary
                </button>
              </nav>
            </div>
          </MobileCard>

          {/* General Settings */}
          {activeTab === 'general' && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MobileInput
                  label="Company Name"
                  value={settings.general.company_name}
                  onChange={(e) => handleInputChange('general', 'company_name', e.target.value)}
                  placeholder="Your Company Name"
                />
                <MobileInput
                  label="Company Email"
                  type="email"
                  value={settings.general.company_email}
                  onChange={(e) => handleInputChange('general', 'company_email', e.target.value)}
                  placeholder="company@example.com"
                />
                <MobileInput
                  label="Company Phone"
                  value={settings.general.company_phone}
                  onChange={(e) => handleInputChange('general', 'company_phone', e.target.value)}
                  placeholder="+1234567890"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <MobileInput
                  label="Working Hours Start"
                  type="time"
                  value={settings.general.working_hours_start}
                  onChange={(e) => handleInputChange('general', 'working_hours_start', e.target.value)}
                />
                <MobileInput
                  label="Working Hours End"
                  type="time"
                  value={settings.general.working_hours_end}
                  onChange={(e) => handleInputChange('general', 'working_hours_end', e.target.value)}
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
                  <textarea
                    value={settings.general.company_address}
                    onChange={(e) => handleInputChange('general', 'company_address', e.target.value)}
                    rows={3}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter company address"
                  />
                </div>
              </div>
            </MobileCard>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Password Policy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <MobileInput
                      label="Minimum Length"
                      type="number"
                      value={settings.security.password_policy.min_length}
                      onChange={(e) => handleNestedInputChange('security', 'password_policy', 'min_length', parseInt(e.target.value))}
                    />
                    <MobileInput
                      label="Session Timeout (minutes)"
                      type="number"
                      value={settings.security.session_timeout}
                      onChange={(e) => handleInputChange('security', 'session_timeout', parseInt(e.target.value))}
                    />
                    <MobileInput
                      label="Max Login Attempts"
                      type="number"
                      value={settings.security.max_login_attempts}
                      onChange={(e) => handleInputChange('security', 'max_login_attempts', parseInt(e.target.value))}
                    />
                    <MobileInput
                      label="Lockout Duration (minutes)"
                      type="number"
                      value={settings.security.lockout_duration}
                      onChange={(e) => handleInputChange('security', 'lockout_duration', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.password_policy.require_uppercase}
                        onChange={(e) => handleNestedInputChange('security', 'password_policy', 'require_uppercase', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require uppercase letters</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.password_policy.require_lowercase}
                        onChange={(e) => handleNestedInputChange('security', 'password_policy', 'require_lowercase', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require lowercase letters</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.password_policy.require_numbers}
                        onChange={(e) => handleNestedInputChange('security', 'password_policy', 'require_numbers', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require numbers</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.security.password_policy.require_special_chars}
                        onChange={(e) => handleNestedInputChange('security', 'password_policy', 'require_special_chars', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Require special characters</span>
                    </label>
                  </div>
                </div>
              </div>
            </MobileCard>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Send notifications via email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.email_notifications}
                      onChange={(e) => handleInputChange('notifications', 'email_notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Send notifications via SMS</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sms_notifications}
                      onChange={(e) => handleInputChange('notifications', 'sms_notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Attendance Alerts</p>
                    <p className="text-sm text-gray-500">Alert on attendance issues</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.attendance_alerts}
                      onChange={(e) => handleInputChange('notifications', 'attendance_alerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Salary Alerts</p>
                    <p className="text-sm text-gray-500">Alert on salary calculations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.salary_alerts}
                      onChange={(e) => handleInputChange('notifications', 'salary_alerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Sales Alerts</p>
                    <p className="text-sm text-gray-500">Alert on sales milestones</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.sales_alerts}
                      onChange={(e) => handleInputChange('notifications', 'sales_alerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Backup Alerts</p>
                    <p className="text-sm text-gray-500">Alert on backup status</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications.backup_alerts}
                      onChange={(e) => handleInputChange('notifications', 'backup_alerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </MobileCard>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Backup Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Automatic Backup</p>
                    <p className="text-sm text-gray-500">Enable automatic daily backups</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.backup.auto_backup}
                      onChange={(e) => handleInputChange('backup', 'auto_backup', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                    <select
                      value={settings.backup.backup_frequency}
                      onChange={(e) => handleInputChange('backup', 'backup_frequency', e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <MobileInput
                    label="Backup Time"
                    type="time"
                    value={settings.backup.backup_time}
                    onChange={(e) => handleInputChange('backup', 'backup_time', e.target.value)}
                  />
                  <MobileInput
                    label="Retention Days"
                    type="number"
                    value={settings.backup.retention_days}
                    onChange={(e) => handleInputChange('backup', 'retention_days', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Compress Backups</p>
                    <p className="text-sm text-gray-500">Compress backup files to save space</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.backup.compress_backups}
                      onChange={(e) => handleInputChange('backup', 'compress_backups', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </MobileCard>
          )}

          {/* Salary Settings */}
          {activeTab === 'salary' && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Salary Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MobileInput
                  label="Default Incentive Percentage"
                  type="number"
                  value={settings.salary.default_incentive_percentage}
                  onChange={(e) => handleInputChange('salary', 'default_incentive_percentage', parseFloat(e.target.value))}
                  placeholder="5"
                />
                <MobileInput
                  label="Advance Deduction Percentage"
                  type="number"
                  value={settings.salary.advance_deduction_percentage}
                  onChange={(e) => handleInputChange('salary', 'advance_deduction_percentage', parseFloat(e.target.value))}
                  placeholder="10"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Calculation Method</label>
                  <select
                    value={settings.salary.salary_calculation_method}
                    onChange={(e) => handleInputChange('salary', 'salary_calculation_method', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="daily">Daily</option>
                    <option value="hourly">Hourly</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Include Sundays</p>
                    <p className="text-sm text-gray-500">Include Sundays in salary calculation</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.salary.include_sundays}
                      onChange={(e) => handleInputChange('salary', 'include_sundays', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </MobileCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;