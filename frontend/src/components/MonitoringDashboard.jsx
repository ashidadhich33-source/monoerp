import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network,
  Server,
  Shield,
  Zap,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Play,
  Square,
  Clock
} from 'lucide-react';
import { apiService } from '../services/api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const MonitoringDashboard = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [automationStatus, setAutomationStatus] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMonitoringData = async () => {
    try {
      setRefreshing(true);
      const [healthRes, metricsRes, alertsRes, automationRes, backupRes, backupsRes] = await Promise.all([
        apiService.getSystemHealth(),
        apiService.getSystemMetrics(),
        apiService.getAlerts(),
        apiService.getAutomationStatus(),
        apiService.getMonitoringBackupStatus(),
        apiService.listMonitoringBackups()
      ]);

      setSystemHealth(healthRes.data);
      setSystemMetrics(metricsRes.data);
      setAlerts(alertsRes.data);
      setAutomationStatus(automationRes.data);
      setBackupStatus(backupRes.data);
      setBackups(backupsRes.data);
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
      showErrorToast('Failed to load monitoring data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await apiService.acknowledgeMonitoringAlert(alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      showSuccessToast('Alert acknowledged');
    } catch (error) {
      showErrorToast('Failed to acknowledge alert');
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await apiService.startMonitoring();
      showSuccessToast('Monitoring started');
      loadMonitoringData();
    } catch (error) {
      showErrorToast('Failed to start monitoring');
    }
  };

  const handleStopMonitoring = async () => {
    try {
      await apiService.stopMonitoring();
      showSuccessToast('Monitoring stopped');
      loadMonitoringData();
    } catch (error) {
      showErrorToast('Failed to stop monitoring');
    }
  };

  const handleStartAutomation = async () => {
    try {
      await apiService.startAutomation();
      showSuccessToast('Automation started');
      loadMonitoringData();
    } catch (error) {
      showErrorToast('Failed to start automation');
    }
  };

  const handleStopAutomation = async () => {
    try {
      await apiService.stopAutomation();
      showSuccessToast('Automation stopped');
      loadMonitoringData();
    } catch (error) {
      showErrorToast('Failed to stop automation');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await apiService.createMonitoringBackup();
      showSuccessToast('Backup created successfully');
      loadMonitoringData();
    } catch (error) {
      showErrorToast('Failed to create backup');
    }
  };

  const handleRestoreBackup = async (backupFilename) => {
    try {
      await apiService.restoreMonitoringBackup(backupFilename);
      showSuccessToast('Backup restored successfully');
      loadMonitoringData();
    } catch (error) {
      showErrorToast('Failed to restore backup');
    }
  };

  const handleDeleteBackup = async (backupFilename) => {
    try {
      await apiService.deleteMonitoringBackup(backupFilename);
      showSuccessToast('Backup deleted successfully');
      loadMonitoringData();
    } catch (error) {
      showErrorToast('Failed to delete backup');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600">Monitor system health, performance, and automation</p>
        </div>
        <button
          onClick={loadMonitoringData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Health</h2>
            <div className="flex items-center space-x-2">
              {getStatusIcon(systemHealth.overall_status)}
              <span className={`font-medium ${getStatusColor(systemHealth.overall_status)}`}>
                {systemHealth.overall_status.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(systemHealth.checks || {}).map(([check, data]) => (
              <div key={check} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{check}</span>
                  {getStatusIcon(data.status)}
                </div>
                <p className="text-sm text-gray-600 mt-1">{data.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span>CPU Usage</span>
                </div>
                <span className="font-medium">{systemMetrics.system?.cpu?.percent || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="w-5 h-5 text-green-600" />
                  <span>Memory Usage</span>
                </div>
                <span className="font-medium">{systemMetrics.system?.memory?.percent || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="w-5 h-5 text-orange-600" />
                  <span>Disk Usage</span>
                </div>
                <span className="font-medium">{systemMetrics.system?.disk?.percent || 0}%</span>
              </div>
            </div>
          </div>

          {/* Application Metrics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-purple-600" />
                  <span>Active Users</span>
                </div>
                <span className="font-medium">{systemMetrics.application?.users?.active || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <span>Today's Attendance</span>
                </div>
                <span className="font-medium">{systemMetrics.application?.attendance?.today || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  <span>Today's Sales</span>
                </div>
                <span className="font-medium">${systemMetrics.application?.sales?.today_amount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-gray-500">No alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className={`p-4 border-l-4 rounded ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-600">{formatDate(alert.timestamp)}</p>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Automation Status */}
      {automationStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Automation Status</h3>
            <div className="flex space-x-2">
              {automationStatus.running ? (
                <button
                  onClick={handleStopAutomation}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleStartAutomation}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Status</span>
              </div>
              <p className={`text-sm ${automationStatus.running ? 'text-green-600' : 'text-gray-600'}`}>
                {automationStatus.running ? 'Running' : 'Stopped'}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="font-medium">Scheduled Tasks</span>
              </div>
              <p className="text-sm text-gray-600">{automationStatus.scheduled_tasks || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Executed Tasks</span>
              </div>
              <p className="text-sm text-gray-600">{automationStatus.executed_tasks || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Backup Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Backup Management</h3>
          <button
            onClick={handleCreateBackup}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Create Backup</span>
          </button>
        </div>
        
        {backupStatus && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Total Backups</span>
              </div>
              <p className="text-sm text-gray-600">{backupStatus.total_backups || 0}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Server className="w-5 h-5 text-green-600" />
                <span className="font-medium">Total Size</span>
              </div>
              <p className="text-sm text-gray-600">{formatBytes(backupStatus.total_size || 0)}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Latest Backup</span>
              </div>
              <p className="text-sm text-gray-600">
                {backupStatus.latest_backup ? formatDate(backupStatus.latest_backup) : 'None'}
              </p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Available Backups</h4>
          {backups.length === 0 ? (
            <p className="text-gray-500">No backups available</p>
          ) : (
            <div className="space-y-2">
              {backups.slice(0, 5).map((backup) => (
                <div key={backup.filename} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{backup.filename}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(backup.created_at)} • {formatBytes(backup.size)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRestoreBackup(backup.filename)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.filename)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;