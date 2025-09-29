import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';
import MobileTable from '../../components/MobileTable';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Clock, 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';

const PerformanceMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, cpu, memory, disk, network
  const [searchTerm, setSearchTerm] = useState('');
  const [timeRange, setTimeRange] = useState('24h'); // 1h, 6h, 24h, 7d, 30d
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [filter, timeRange, autoRefresh]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct performance metrics endpoint, we'll simulate the data
      // In a real implementation, you would call apiService.getPerformanceMetrics()
      const mockMetrics = [
        {
          id: 1,
          metric_type: 'cpu_usage',
          value: 45.2,
          details: { cores: 8, load_average: [1.2, 1.5, 1.8] },
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          metric_type: 'memory_usage',
          value: 67.8,
          details: { total: 16384, used: 11108, free: 5276, cached: 1200 },
          timestamp: new Date().toISOString()
        },
        {
          id: 3,
          metric_type: 'disk_usage',
          value: 34.5,
          details: { total: 1000000, used: 345000, free: 655000 },
          timestamp: new Date().toISOString()
        },
        {
          id: 4,
          metric_type: 'network_io',
          value: 125.6,
          details: { bytes_in: 1024000, bytes_out: 512000, packets_in: 1500, packets_out: 1200 },
          timestamp: new Date().toISOString()
        },
        {
          id: 5,
          metric_type: 'response_time',
          value: 245.8,
          details: { avg_response_time: 245.8, min_response_time: 120.5, max_response_time: 890.2 },
          timestamp: new Date().toISOString()
        },
        {
          id: 6,
          metric_type: 'active_connections',
          value: 156,
          details: { http_connections: 120, database_connections: 36 },
          timestamp: new Date().toISOString()
        }
      ];
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metricType) => {
    switch (metricType) {
      case 'cpu_usage':
        return <Cpu className="h-5 w-5 text-blue-500" />;
      case 'memory_usage':
        return <HardDrive className="h-5 w-5 text-green-500" />;
      case 'disk_usage':
        return <HardDrive className="h-5 w-5 text-purple-500" />;
      case 'network_io':
        return <Wifi className="h-5 w-5 text-orange-500" />;
      case 'response_time':
        return <Clock className="h-5 w-5 text-red-500" />;
      case 'active_connections':
        return <Activity className="h-5 w-5 text-indigo-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getMetricStatus = (metricType, value) => {
    switch (metricType) {
      case 'cpu_usage':
        if (value > 80) return { status: 'Critical', color: 'text-red-600 bg-red-50' };
        if (value > 60) return { status: 'Warning', color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Normal', color: 'text-green-600 bg-green-50' };
      case 'memory_usage':
        if (value > 90) return { status: 'Critical', color: 'text-red-600 bg-red-50' };
        if (value > 75) return { status: 'Warning', color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Normal', color: 'text-green-600 bg-green-50' };
      case 'disk_usage':
        if (value > 90) return { status: 'Critical', color: 'text-red-600 bg-red-50' };
        if (value > 80) return { status: 'Warning', color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Normal', color: 'text-green-600 bg-green-50' };
      case 'response_time':
        if (value > 1000) return { status: 'Critical', color: 'text-red-600 bg-red-50' };
        if (value > 500) return { status: 'Warning', color: 'text-yellow-600 bg-yellow-50' };
        return { status: 'Normal', color: 'text-green-600 bg-green-50' };
      default:
        return { status: 'Normal', color: 'text-green-600 bg-green-50' };
    }
  };

  const getMetricUnit = (metricType) => {
    switch (metricType) {
      case 'cpu_usage':
      case 'memory_usage':
      case 'disk_usage':
        return '%';
      case 'response_time':
        return 'ms';
      case 'network_io':
        return 'KB/s';
      case 'active_connections':
        return 'connections';
      default:
        return '';
    }
  };

  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = metric.metric_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || metric.metric_type.includes(filter);
    return matchesSearch && matchesFilter;
  });

  const totalMetrics = metrics.length;
  const criticalMetrics = metrics.filter(metric => {
    const status = getMetricStatus(metric.metric_type, metric.value);
    return status.status === 'Critical';
  }).length;
  const warningMetrics = metrics.filter(metric => {
    const status = getMetricStatus(metric.metric_type, metric.value);
    return status.status === 'Warning';
  }).length;
  const normalMetrics = metrics.filter(metric => {
    const status = getMetricStatus(metric.metric_type, metric.value);
    return status.status === 'Normal';
  }).length;

  if (loading) {
    return <MobileLoading fullScreen text="Loading performance metrics..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Metrics</h1>
              <p className="text-gray-600">System performance monitoring and analytics</p>
            </div>
            <div className="flex space-x-3">
              <MobileButton
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? 'primary' : 'secondary'}
                size="md"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
              </MobileButton>
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
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Metrics</p>
                  <p className="text-2xl font-bold text-gray-900">{totalMetrics}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Normal</p>
                  <p className="text-2xl font-bold text-gray-900">{normalMetrics}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{warningMetrics}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{criticalMetrics}</p>
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
                    placeholder="Search metrics..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <MobileButton
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  All
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('cpu')}
                  variant={filter === 'cpu' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  CPU
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('memory')}
                  variant={filter === 'memory' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Memory
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('disk')}
                  variant={filter === 'disk' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Disk
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('network')}
                  variant={filter === 'network' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Network
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* Performance Metrics List */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
            {filteredMetrics.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No performance metrics found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMetrics.map((metric) => {
                  const status = getMetricStatus(metric.metric_type, metric.value);
                  
                  return (
                    <div key={metric.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          {getMetricIcon(metric.metric_type)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900 capitalize">
                                {metric.metric_type.replace('_', ' ')}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                                {status.status}
                              </span>
                            </div>
                            <div className="mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-2xl font-bold text-gray-900">
                                  {metric.value.toFixed(1)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {getMetricUnit(metric.metric_type)}
                                </span>
                              </div>
                              {metric.details && Object.keys(metric.details).length > 0 && (
                                <div className="mt-2 text-xs text-gray-600">
                                  <p><strong>Details:</strong> {JSON.stringify(metric.details)}</p>
                                </div>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(metric.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            {metric.value.toFixed(1)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getMetricUnit(metric.metric_type)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;