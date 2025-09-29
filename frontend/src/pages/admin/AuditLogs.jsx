import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';
import MobileTable from '../../components/MobileTable';
import { 
  FileText, 
  User, 
  Activity, 
  AlertTriangle, 
  Info, 
  Shield,
  Clock,
  Filter,
  Search,
  Download,
  Eye,
  Trash2
} from 'lucide-react';

const AuditLogs = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, info, warning, error, critical
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [filter, selectedAction, dateRange]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct audit logs endpoint, we'll simulate the data
      // In a real implementation, you would call apiService.getAuditLogs()
      const mockAuditLogs = [
        {
          id: 1,
          user_id: 1,
          action: 'login',
          resource_type: 'user',
          resource_id: 1,
          details: { ip_address: '192.168.1.100', user_agent: 'Mozilla/5.0...' },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'info',
          timestamp: '2024-01-31T10:00:00Z'
        },
        {
          id: 2,
          user_id: 1,
          action: 'create',
          resource_type: 'staff',
          resource_id: 5,
          details: { staff_name: 'New Employee', department: 'Sales' },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'info',
          timestamp: '2024-01-31T09:45:00Z'
        },
        {
          id: 3,
          user_id: 2,
          action: 'update',
          resource_type: 'salary',
          resource_id: 3,
          details: { amount_changed: 5000, previous_amount: 45000 },
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          severity: 'warning',
          timestamp: '2024-01-31T09:30:00Z'
        },
        {
          id: 4,
          user_id: null,
          action: 'system_error',
          resource_type: 'database',
          resource_id: null,
          details: { error_message: 'Connection timeout', retry_count: 3 },
          ip_address: '127.0.0.1',
          user_agent: 'System',
          severity: 'error',
          timestamp: '2024-01-31T09:15:00Z'
        },
        {
          id: 5,
          user_id: 1,
          action: 'delete',
          resource_type: 'sales',
          resource_id: 10,
          details: { deleted_amount: 15000, reason: 'Duplicate entry' },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          severity: 'critical',
          timestamp: '2024-01-31T09:00:00Z'
        }
      ];
      setAuditLogs(mockAuditLogs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'create':
        return <FileText className="h-4 w-4" />;
      case 'update':
        return <Activity className="h-4 w-4" />;
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'system_error':
        return <Shield className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filter === 'all' || log.severity === filter;
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesSeverity && matchesAction;
  });

  const totalLogs = auditLogs.length;
  const criticalLogs = auditLogs.filter(log => log.severity === 'critical').length;
  const errorLogs = auditLogs.filter(log => log.severity === 'error').length;
  const warningLogs = auditLogs.filter(log => log.severity === 'warning').length;

  if (loading) {
    return <MobileLoading fullScreen text="Loading audit logs..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-gray-600">System activity and security logs</p>
            </div>
            <div className="flex space-x-3">
              <MobileButton
                onClick={() => {/* Export functionality */}}
                variant="secondary"
                size="md"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </MobileButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Logs</p>
                  <p className="text-2xl font-bold text-gray-900">{totalLogs}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Critical</p>
                  <p className="text-2xl font-bold text-gray-900">{criticalLogs}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Errors</p>
                  <p className="text-2xl font-bold text-gray-900">{errorLogs}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Warnings</p>
                  <p className="text-2xl font-bold text-gray-900">{warningLogs}</p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Filters and Search */}
          <MobileCard className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="system_error">System Error</option>
                </select>
                <MobileButton
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  All
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('critical')}
                  variant={filter === 'critical' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Critical
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('error')}
                  variant={filter === 'error' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Error
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('warning')}
                  variant={filter === 'warning' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Warning
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* Audit Logs List */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h3>
            {filteredAuditLogs.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAuditLogs.map((log) => (
                  <div key={log.id} className={`p-4 border rounded-lg ${getSeverityColor(log.severity)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getSeverityIcon(log.severity)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {getActionIcon(log.action)}
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {log.action.replace('_', ' ')}
                              </span>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(log.severity)}`}>
                              {log.severity.toUpperCase()}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            <p><strong>Resource:</strong> {log.resource_type} {log.resource_id ? `#${log.resource_id}` : ''}</p>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <p><strong>Details:</strong> {JSON.stringify(log.details)}</p>
                            )}
                            <p><strong>IP:</strong> {log.ip_address}</p>
                            <p><strong>User Agent:</strong> {log.user_agent}</p>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;