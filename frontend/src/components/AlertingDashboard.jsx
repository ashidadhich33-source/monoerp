import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  Settings, 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Play,
  Square,
  Filter,
  Search
} from 'lucide-react';
import { apiService } from '../services/api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const AlertingDashboard = () => {
  const [alertingStatus, setAlertingStatus] = useState(null);
  const [alertRules, setAlertRules] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [alertStatistics, setAlertStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    severity: '',
    acknowledged: '',
    resolved: ''
  });
  const [newRule, setNewRule] = useState({
    name: '',
    config: {
      type: 'threshold',
      metric: '',
      threshold: 0,
      operator: '>',
      severity: 'warning',
      message: ''
    }
  });

  useEffect(() => {
    loadAlertingData();
    const interval = setInterval(loadAlertingData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAlertingData = async () => {
    try {
      const [statusRes, rulesRes, historyRes, statsRes] = await Promise.all([
        apiService.getAlertingStatus(),
        apiService.getAlertRules(),
        apiService.getAlertHistory(100, filters.severity, filters.acknowledged, filters.resolved),
        apiService.getAlertStatistics()
      ]);

      setAlertingStatus(statusRes.data);
      setAlertRules(rulesRes.data);
      setAlertHistory(historyRes.data);
      setAlertStatistics(statsRes.data);
    } catch (error) {
      console.error('Failed to load alerting data:', error);
      showErrorToast('Failed to load alerting data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      if (!newRule.name.trim()) {
        showErrorToast('Please enter a rule name');
        return;
      }

      const response = await apiService.createAlertRule(newRule.name, newRule.config);
      
      if (response.success) {
        showSuccessToast('Alert rule created successfully');
        setNewRule({
          name: '',
          config: {
            type: 'threshold',
            metric: '',
            threshold: 0,
            operator: '>',
            severity: 'warning',
            message: ''
          }
        });
        loadAlertingData();
      } else {
        showErrorToast('Failed to create alert rule');
      }
    } catch (error) {
      showErrorToast('Failed to create alert rule');
    }
  };

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await apiService.acknowledgeAlertingAlert(alertId);
      
      if (response.success) {
        showSuccessToast('Alert acknowledged');
        loadAlertingData();
      } else {
        showErrorToast('Failed to acknowledge alert');
      }
    } catch (error) {
      showErrorToast('Failed to acknowledge alert');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const response = await apiService.resolveAlert(alertId);
      
      if (response.success) {
        showSuccessToast('Alert resolved');
        loadAlertingData();
      } else {
        showErrorToast('Failed to resolve alert');
      }
    } catch (error) {
      showErrorToast('Failed to resolve alert');
    }
  };

  const handleEnableRule = async (ruleName) => {
    try {
      const response = await apiService.enableAlertRule(ruleName);
      
      if (response.success) {
        showSuccessToast('Alert rule enabled');
        loadAlertingData();
      } else {
        showErrorToast('Failed to enable alert rule');
      }
    } catch (error) {
      showErrorToast('Failed to enable alert rule');
    }
  };

  const handleDisableRule = async (ruleName) => {
    try {
      const response = await apiService.disableAlertRule(ruleName);
      
      if (response.success) {
        showSuccessToast('Alert rule disabled');
        loadAlertingData();
      } else {
        showErrorToast('Failed to disable alert rule');
      }
    } catch (error) {
      showErrorToast('Failed to disable alert rule');
    }
  };

  const handleDeleteRule = async (ruleName) => {
    try {
      if (!window.confirm(`Are you sure you want to delete alert rule '${ruleName}'?`)) {
        return;
      }

      const response = await apiService.deleteAlertRule(ruleName);
      
      if (response.success) {
        showSuccessToast('Alert rule deleted successfully');
        loadAlertingData();
      } else {
        showErrorToast('Failed to delete alert rule');
      }
    } catch (error) {
      showErrorToast('Failed to delete alert rule');
    }
  };

  const handleStartAlerting = async () => {
    try {
      const response = await apiService.startAlerting();
      
      if (response.success) {
        showSuccessToast('Alerting service started');
        loadAlertingData();
      } else {
        showErrorToast('Failed to start alerting service');
      }
    } catch (error) {
      showErrorToast('Failed to start alerting service');
    }
  };

  const handleStopAlerting = async () => {
    try {
      const response = await apiService.stopAlerting();
      
      if (response.success) {
        showSuccessToast('Alerting service stopped');
        loadAlertingData();
      } else {
        showErrorToast('Failed to stop alerting service');
      }
    } catch (error) {
      showErrorToast('Failed to stop alerting service');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Activity className="w-5 h-5 text-blue-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Alerting Dashboard</h1>
          <p className="text-gray-600">Monitor system alerts and manage alert rules</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={loadAlertingData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          {alertingStatus?.alerting_active ? (
            <button
              onClick={handleStopAlerting}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleStartAlerting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              <span>Start</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerting Status */}
      {alertingStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alerting Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Status</span>
              </div>
              <p className={`text-sm font-medium ${alertingStatus.alerting_active ? 'text-green-600' : 'text-red-600'}`}>
                {alertingStatus.alerting_active ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Settings className="w-5 h-5 text-green-600" />
                <span className="font-medium">Total Rules</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alertingStatus.total_rules || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Active Rules</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alertingStatus.active_rules || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Total Alerts</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alertingStatus.total_alerts || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alert Statistics */}
      {alertStatistics && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alert Statistics</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Acknowledged</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alertStatistics.acknowledged_alerts || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium">Unacknowledged</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alertStatistics.unacknowledged_alerts || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Resolved</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alertStatistics.resolved_alerts || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Unresolved</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{alertStatistics.unresolved_alerts || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* Alert Rules */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alert Rules</h2>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="w-4 h-4" />
            <span>New Rule</span>
          </button>
        </div>
        
        {alertRules.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No alert rules configured</p>
            <p className="text-sm text-gray-400">Create your first alert rule to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertRules.map((rule) => (
              <div key={rule.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${rule.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                      {rule.enabled ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{rule.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {rule.config.type} • Triggered: {rule.trigger_count} times
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${rule.enabled ? 'text-green-600' : 'text-gray-600'}`}>
                      {rule.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Severity</p>
                    <p className={`text-sm font-medium ${getSeverityColor(rule.config.severity).split(' ')[0]}`}>
                      {rule.config.severity.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Last Triggered</p>
                    <p className="text-sm font-medium">{formatDate(rule.last_triggered || 'Never')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-sm font-medium">{formatDate(rule.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {rule.enabled ? (
                    <button
                      onClick={() => handleDisableRule(rule.name)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                    >
                      <Square className="w-4 h-4" />
                      <span>Disable</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnableRule(rule.name)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      <Play className="w-4 h-4" />
                      <span>Enable</span>
                    </button>
                  )}
                  
                  <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRule(rule.name)}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Alert History</h2>
          </div>
          
          <div className="flex space-x-2">
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
            
            <select
              value={filters.acknowledged}
              onChange={(e) => setFilters(prev => ({ ...prev, acknowledged: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Alerts</option>
              <option value="true">Acknowledged</option>
              <option value="false">Unacknowledged</option>
            </select>
            
            <select
              value={filters.resolved}
              onChange={(e) => setFilters(prev => ({ ...prev, resolved: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Alerts</option>
              <option value="true">Resolved</option>
              <option value="false">Unresolved</option>
            </select>
          </div>
        </div>
        
        {alertHistory.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No alerts found</p>
            <p className="text-sm text-gray-400">Alerts will appear here when triggered</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alertHistory.map((alert) => (
              <div key={alert.id} className={`p-4 border-l-4 rounded ${
                alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                alert.severity === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                'border-blue-500 bg-blue-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-gray-600">
                        Rule: {alert.rule_name} • {formatDate(alert.timestamp)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Acknowledge
                      </button>
                    )}
                    
                    {!alert.resolved && (
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create New Rule Modal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Create New Alert Rule</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Name
            </label>
            <input
              type="text"
              value={newRule.name}
              onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter rule name"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Type
              </label>
              <select
                value={newRule.config.type}
                onChange={(e) => setNewRule(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, type: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="threshold">Threshold</option>
                <option value="anomaly">Anomaly</option>
                <option value="pattern">Pattern</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metric
              </label>
              <input
                type="text"
                value={newRule.config.metric}
                onChange={(e) => setNewRule(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, metric: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., cpu_usage, memory_usage"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Threshold
              </label>
              <input
                type="number"
                value={newRule.config.threshold}
                onChange={(e) => setNewRule(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, threshold: parseFloat(e.target.value) }
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operator
              </label>
              <select
                value={newRule.config.operator}
                onChange={(e) => setNewRule(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, operator: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value=">">Greater than</option>
                <option value="<">Less than</option>
                <option value=">=">Greater than or equal</option>
                <option value="<=">Less than or equal</option>
                <option value="==">Equal to</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={newRule.config.severity}
                onChange={(e) => setNewRule(prev => ({ 
                  ...prev, 
                  config: { ...prev.config, severity: e.target.value }
                }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Message
            </label>
            <input
              type="text"
              value={newRule.config.message}
              onChange={(e) => setNewRule(prev => ({ 
                ...prev, 
                config: { ...prev.config, message: e.target.value }
              }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter alert message"
            />
          </div>
          
          <button
            onClick={handleCreateRule}
            disabled={!newRule.name.trim() || !newRule.config.metric.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertingDashboard;