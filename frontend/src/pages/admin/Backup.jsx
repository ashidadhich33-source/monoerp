import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';

const AdminBackup = () => {
  const { user, logout } = useAuth();
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupHistory, setBackupHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    fetchBackupData();
  }, []);

  const fetchBackupData = async () => {
    try {
      const [status, history] = await Promise.all([
        apiService.getBackupStatus(),
        apiService.getBackupHistory()
      ]);
      setBackupStatus(status);
      setBackupHistory(history.backups || history);
    } catch (error) {
      console.error('Failed to fetch backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      await apiService.createBackup();
      fetchBackupData();
    } catch (error) {
      console.error('Failed to create backup:', error);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId) => {
    if (window.confirm('Are you sure you want to restore this backup? This will overwrite current data.')) {
      try {
        await apiService.restoreBackup(backupId);
        fetchBackupData();
      } catch (error) {
        console.error('Failed to restore backup:', error);
      }
    }
  };

  const handleDeleteBackup = async (backupId) => {
    if (window.confirm('Are you sure you want to delete this backup?')) {
      try {
        await apiService.deleteBackup(backupId);
        fetchBackupData();
      } catch (error) {
        console.error('Failed to delete backup:', error);
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading backup data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Backup Management</h1>
              <p className="text-sm text-gray-600">Manage database backups and restore data</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Backup Status */}
          <MobileCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Backup Status</h3>
              <MobileButton
                onClick={handleCreateBackup}
                variant="primary"
                size="md"
                disabled={creatingBackup}
              >
                {creatingBackup ? 'Creating...' : 'Create Backup'}
              </MobileButton>
            </div>
            
            {backupStatus && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Last Backup</p>
                  <p className="text-lg font-bold text-gray-900">
                    {backupStatus.last_backup ? new Date(backupStatus.last_backup).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Backup Size</p>
                  <p className="text-lg font-bold text-gray-900">
                    {backupStatus.backup_size ? formatFileSize(backupStatus.backup_size) : 'N/A'}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">Auto Backup</p>
                  <p className="text-lg font-bold text-gray-900">
                    {backupStatus.auto_backup_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            )}
          </MobileCard>

          {/* Backup History */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Backup History</h3>
              <p className="text-sm text-gray-500 mt-1">View and manage your backup files</p>
            </div>
            
            <div className="p-6">
              {backupHistory.length > 0 ? (
                <div className="space-y-4">
                  {backupHistory.map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">{backup.filename}</p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(backup.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            <p>Size: {formatFileSize(backup.file_size)}</p>
                            <p>Type: {backup.backup_type}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <MobileButton
                          onClick={() => handleRestoreBackup(backup.id)}
                          variant="primary"
                          size="sm"
                        >
                          Restore
                        </MobileButton>
                        <MobileButton
                          onClick={() => handleDeleteBackup(backup.id)}
                          variant="danger"
                          size="sm"
                        >
                          Delete
                        </MobileButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No backup files found</p>
                </div>
              )}
            </div>
          </MobileCard>

          {/* Backup Settings */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Automatic Daily Backup</p>
                  <p className="text-sm text-gray-500">Automatically create backups every day at 2:00 AM</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Compress Backups</p>
                  <p className="text-sm text-gray-500">Compress backup files to save storage space</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Retention Period</p>
                  <p className="text-sm text-gray-500">Keep backups for 30 days</p>
                </div>
                <select className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  <option value="7">7 days</option>
                  <option value="30" selected>30 days</option>
                  <option value="90">90 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>
            </div>
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default AdminBackup;