import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  Play, 
  TestTube, 
  Settings, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Database,
  HardDrive,
  Activity
} from 'lucide-react';
import { apiService } from '../services/api';
import { showErrorToast, showSuccessToast } from '../utils/errorHandler';

const DisasterRecoveryManager = () => {
  const [recoveryStatus, setRecoveryStatus] = useState(null);
  const [recoveryPlans, setRecoveryPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState({});
  const [testing, setTesting] = useState({});
  const [newPlan, setNewPlan] = useState({ name: '', config: {} });

  useEffect(() => {
    loadRecoveryData();
  }, []);

  const loadRecoveryData = async () => {
    try {
      const [statusRes, plansRes] = await Promise.all([
        apiService.getRecoveryStatus(),
        apiService.getRecoveryPlans()
      ]);

      setRecoveryStatus(statusRes.data);
      setRecoveryPlans(plansRes.data);
    } catch (error) {
      console.error('Failed to load recovery data:', error);
      showErrorToast('Failed to load recovery data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      if (!newPlan.name.trim()) {
        showErrorToast('Please enter a plan name');
        return;
      }

      const response = await apiService.createRecoveryPlan(newPlan.name, newPlan.config);
      
      if (response.success) {
        showSuccessToast('Recovery plan created successfully');
        setNewPlan({ name: '', config: {} });
        loadRecoveryData();
      } else {
        showErrorToast('Failed to create recovery plan');
      }
    } catch (error) {
      showErrorToast('Failed to create recovery plan');
    }
  };

  const handleExecutePlan = async (planName) => {
    try {
      setExecuting(prev => ({ ...prev, [planName]: true }));
      const response = await apiService.executeRecoveryPlan(planName);
      
      if (response.success) {
        showSuccessToast(`Recovery plan '${planName}' executed successfully`);
        loadRecoveryData();
      } else {
        showErrorToast(`Failed to execute recovery plan: ${response.data.error}`);
      }
    } catch (error) {
      showErrorToast('Failed to execute recovery plan');
    } finally {
      setExecuting(prev => ({ ...prev, [planName]: false }));
    }
  };

  const handleTestPlan = async (planName) => {
    try {
      setTesting(prev => ({ ...prev, [planName]: true }));
      const response = await apiService.testRecoveryPlan(planName);
      
      if (response.success) {
        showSuccessToast(`Recovery plan '${planName}' tested successfully`);
        loadRecoveryData();
      } else {
        showErrorToast(`Failed to test recovery plan: ${response.data.error}`);
      }
    } catch (error) {
      showErrorToast('Failed to test recovery plan');
    } finally {
      setTesting(prev => ({ ...prev, [planName]: false }));
    }
  };

  const handleDeletePlan = async (planName) => {
    try {
      if (!window.confirm(`Are you sure you want to delete recovery plan '${planName}'?`)) {
        return;
      }

      const response = await apiService.deleteRecoveryPlan(planName);
      
      if (response.success) {
        showSuccessToast('Recovery plan deleted successfully');
        loadRecoveryData();
      } else {
        showErrorToast('Failed to delete recovery plan');
      }
    } catch (error) {
      showErrorToast('Failed to delete recovery plan');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'inactive': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
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
          <h1 className="text-2xl font-bold text-gray-900">Disaster Recovery</h1>
          <p className="text-gray-600">Manage disaster recovery plans and backup strategies</p>
        </div>
        <button
          onClick={loadRecoveryData}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Recovery Status Overview */}
      {recoveryStatus && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recovery Status</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Total Plans</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{recoveryStatus.total_plans || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium">Active Plans</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{recoveryStatus.active_plans || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="font-medium">RTO (Hours)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{recoveryStatus.recovery_time_objective || 0}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive className="w-5 h-5 text-orange-600" />
                <span className="font-medium">RPO (Hours)</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{recoveryStatus.recovery_point_objective || 0}</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span className="font-medium">Last Backup</span>
              </div>
              <p className="text-sm text-gray-600">{formatDate(recoveryStatus.last_backup)}</p>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <span className="font-medium">Last Recovery</span>
              </div>
              <p className="text-sm text-gray-600">{formatDate(recoveryStatus.last_recovery)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Plans */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recovery Plans</h2>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Plus className="w-4 h-4" />
            <span>New Plan</span>
          </button>
        </div>
        
        {recoveryPlans.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recovery plans configured</p>
            <p className="text-sm text-gray-400">Create your first recovery plan to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recoveryPlans.map((plan) => (
              <div key={plan.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(plan.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">
                        Created: {formatDate(plan.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getStatusColor(plan.status)}`}>
                      {plan.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Last Tested</p>
                    <p className="text-sm font-medium">{formatDate(plan.last_tested)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Test Count</p>
                    <p className="text-sm font-medium">{plan.test_count || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`text-sm font-medium ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleTestPlan(plan.name)}
                    disabled={testing[plan.name]}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {testing[plan.name] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    <span>Test</span>
                  </button>
                  
                  <button
                    onClick={() => handleExecutePlan(plan.name)}
                    disabled={executing[plan.name]}
                    className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {executing[plan.name] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span>Execute</span>
                  </button>
                  
                  <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeletePlan(plan.name)}
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

      {/* Create New Plan Modal */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Create New Recovery Plan</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plan Name
            </label>
            <input
              type="text"
              value={newPlan.name}
              onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter recovery plan name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Configuration
            </label>
            <textarea
              value={JSON.stringify(newPlan.config, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  setNewPlan(prev => ({ ...prev, config }));
                } catch (error) {
                  // Invalid JSON, keep the text
                }
              }}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder='{"backup_retention": 30, "recovery_time": 4}'
            />
          </div>
          
          <button
            onClick={handleCreatePlan}
            disabled={!newPlan.name.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {/* Emergency Recovery */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-lg font-semibold text-red-900">Emergency Recovery</h2>
        </div>
        
        <p className="text-red-700 mb-4">
          Use emergency recovery only in critical situations. This will immediately execute
          the selected recovery plan and may cause data loss.
        </p>
        
        <div className="flex space-x-2">
          <select className="flex-1 p-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
            <option value="">Select recovery plan</option>
            {recoveryPlans.map((plan) => (
              <option key={plan.name} value={plan.name}>{plan.name}</option>
            ))}
          </select>
          
          <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <AlertTriangle className="w-4 h-4" />
            <span>Emergency Recovery</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisasterRecoveryManager;