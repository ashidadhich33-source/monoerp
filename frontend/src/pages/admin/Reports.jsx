import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileLoading from '../../components/MobileLoading';

const AdminReports = () => {
  const { user, logout } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getReportData(dateRange.start, dateRange.end, reportType);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      // Set default data structure
      setReportData({
        totalSales: 0,
        totalStaff: 0,
        totalAttendance: 0,
        topPerformers: [],
        salesByBrand: [],
        monthlyTrend: []
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      await apiService.exportReport(dateRange.start, dateRange.end, reportType, format);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading report data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-sm text-gray-600">Comprehensive reporting and analytics dashboard</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Report Controls */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MobileInput
                label="Start Date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <MobileInput
                label="End Date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="overview">Overview</option>
                  <option value="sales">Sales Report</option>
                  <option value="attendance">Attendance Report</option>
                  <option value="performance">Performance Report</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <MobileButton
                onClick={() => exportReport('excel')}
                variant="success"
                size="md"
              >
                Export Excel
              </MobileButton>
              <MobileButton
                onClick={() => exportReport('pdf')}
                variant="danger"
                size="md"
              >
                Export PDF
              </MobileButton>
            </div>
          </MobileCard>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{reportData?.totalSales?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-1.656-.895-3-2-3M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-1.656.895-3 2-3m0 0a3 3 0 100-6 3 3 0 000 6z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.totalStaff || 0}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData?.attendanceRate || 0}%
                  </p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {reportData?.growthRate || 0}%
                  </p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
              {reportData?.topPerformers && reportData.topPerformers.length > 0 ? (
                <div className="space-y-3">
                  {reportData.topPerformers.map((performer, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-900 mr-3">#{performer.rank}</span>
                        <span className="font-medium text-gray-900">{performer.staff_name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500">
                        ₹{performer.total_sales?.toLocaleString() || 0}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No performance data available</p>
              )}
            </MobileCard>

            {/* Sales by Brand */}
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Brand</h3>
              {reportData?.salesByBrand && reportData.salesByBrand.length > 0 ? (
                <div className="space-y-3">
                  {reportData.salesByBrand.map((brand, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{brand.brand_name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">
                          ₹{brand.total_sales?.toLocaleString() || 0}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({brand.percentage?.toFixed(1) || 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No brand data available</p>
              )}
            </MobileCard>
          </div>

          {/* Monthly Trend */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
            {reportData?.monthlyTrend && reportData.monthlyTrend.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sales
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyTrend.map((trend, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {trend.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{trend.sales?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {trend.attendance || 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No trend data available</p>
            )}
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;