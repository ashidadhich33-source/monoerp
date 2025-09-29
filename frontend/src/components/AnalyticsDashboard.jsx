import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import MobileCard from './MobileCard';
import MobileLoading from './MobileLoading';

const AnalyticsDashboard = ({ isOpen, onClose }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('sales');

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAnalytics(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat('en-IN').format(number);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getMetricIcon = (metric) => {
    switch (metric) {
      case 'sales':
        return (
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'attendance':
        return (
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'performance':
        return (
          <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <MobileLoading text="Loading analytics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Time Range Selector */}
          <div className="mt-4 flex space-x-2">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  timeRange === range
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {range === '7d' ? '7 Days' : 
                 range === '30d' ? '30 Days' :
                 range === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics?.total_sales || 0)}
                  </p>
                  <p className="text-sm text-green-600">
                    +{formatPercentage(analytics?.sales_growth || 0)} from last period
                  </p>
                </div>
                {getMetricIcon('sales')}
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPercentage(analytics?.attendance_rate || 0)}
                  </p>
                  <p className="text-sm text-blue-600">
                    {analytics?.total_attendance || 0} total check-ins
                  </p>
                </div>
                {getMetricIcon('attendance')}
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Staff</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(analytics?.active_staff || 0)}
                  </p>
                  <p className="text-sm text-purple-600">
                    {analytics?.new_staff || 0} new this period
                  </p>
                </div>
                {getMetricIcon('performance')}
              </div>
            </MobileCard>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend Chart */}
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Chart visualization would go here</p>
                </div>
              </div>
            </MobileCard>

            {/* Top Performers */}
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
              <div className="space-y-3">
                {analytics?.top_performers?.map((performer, index) => (
                  <div key={performer.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{performer.name}</p>
                        <p className="text-xs text-gray-500">{performer.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(performer.sales)}
                      </p>
                      <p className="text-xs text-green-600">
                        {formatPercentage(performer.achievement)} achieved
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No performance data available</p>
                  </div>
                )}
              </div>
            </MobileCard>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Department Performance */}
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
              <div className="space-y-3">
                {analytics?.department_performance?.map((dept) => (
                  <div key={dept.name} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                      <p className="text-xs text-gray-500">{dept.staff_count} staff</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(dept.sales)}
                      </p>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${dept.performance}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No department data available</p>
                  </div>
                )}
              </div>
            </MobileCard>

            {/* Attendance Summary */}
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Present</span>
                  <span className="text-sm font-medium text-green-600">
                    {analytics?.attendance_summary?.present || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Absent</span>
                  <span className="text-sm font-medium text-red-600">
                    {analytics?.attendance_summary?.absent || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Late</span>
                  <span className="text-sm font-medium text-yellow-600">
                    {analytics?.attendance_summary?.late || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Half Day</span>
                  <span className="text-sm font-medium text-blue-600">
                    {analytics?.attendance_summary?.half_day || 0}
                  </span>
                </div>
              </div>
            </MobileCard>

            {/* Recent Activity */}
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {analytics?.recent_activity?.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </MobileCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;