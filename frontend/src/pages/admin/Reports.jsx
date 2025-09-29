import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileLoading from '../../components/MobileLoading';

const AdminReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [reportData, setReportData] = useState({
    sales: [],
    attendance: [],
    performance: []
  });
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchReportData();
  }, [activeReport, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = dateRange;
      
      let data = {};
      let summaryData = {};

      switch (activeReport) {
        case 'sales':
          data.sales = await apiService.getSalesReport(startDate, endDate);
          summaryData = calculateSalesSummary(data.sales);
          break;
        case 'attendance':
          data.attendance = await apiService.getAttendanceReport(startDate, endDate);
          summaryData = calculateAttendanceSummary(data.attendance);
          break;
        case 'performance':
          data.performance = await apiService.getPerformanceReport(startDate, endDate);
          summaryData = calculatePerformanceSummary(data.performance);
          break;
        default:
          break;
      }

      setReportData(prev => ({ ...prev, ...data }));
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalesSummary = (sales) => {
    if (!sales || sales.length === 0) return {};
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.sale_amount, 0);
    const totalUnits = sales.reduce((sum, sale) => sum + sale.units_sold, 0);
    const avgSale = totalSales / sales.length;
    
    // Group by staff
    const staffSales = sales.reduce((acc, sale) => {
      const staffName = sale.staff_name;
      if (!acc[staffName]) {
        acc[staffName] = { total: 0, count: 0, units: 0 };
      }
      acc[staffName].total += sale.sale_amount;
      acc[staffName].count += 1;
      acc[staffName].units += sale.units_sold;
      return acc;
    }, {});

    const topPerformer = Object.entries(staffSales)
      .sort(([,a], [,b]) => b.total - a.total)[0];

    return {
      totalSales,
      totalUnits,
      avgSale,
      totalRecords: sales.length,
      topPerformer: topPerformer ? {
        name: topPerformer[0],
        amount: topPerformer[1].total
      } : null
    };
  };

  const calculateAttendanceSummary = (attendance) => {
    if (!attendance || attendance.length === 0) return {};
    
    const totalDays = attendance.length;
    const presentDays = attendance.filter(record => record.status === 'present').length;
    const attendanceRate = (presentDays / totalDays) * 100;
    
    // Group by staff
    const staffAttendance = attendance.reduce((acc, record) => {
      const staffName = record.staff_name;
      if (!acc[staffName]) {
        acc[staffName] = { present: 0, total: 0 };
      }
      acc[staffName].total += 1;
      if (record.status === 'present') {
        acc[staffName].present += 1;
      }
      return acc;
    }, {});

    return {
      totalDays,
      presentDays,
      attendanceRate,
      staffCount: Object.keys(staffAttendance).length,
      staffAttendance
    };
  };

  const calculatePerformanceSummary = (performance) => {
    if (!performance || performance.length === 0) return {};
    
    const totalTarget = performance.reduce((sum, perf) => sum + (perf.target_amount || 0), 0);
    const totalAchieved = performance.reduce((sum, perf) => sum + (perf.achieved_amount || 0), 0);
    const avgPerformance = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;
    
    const topPerformers = performance
      .sort((a, b) => (b.achievement_percentage || 0) - (a.achievement_percentage || 0))
      .slice(0, 3);

    return {
      totalTarget,
      totalAchieved,
      avgPerformance,
      topPerformers,
      totalStaff: performance.length
    };
  };

  const handleDateFilter = () => {
    fetchReportData();
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  const exportReport = async (format = 'csv') => {
    try {
      // This would need backend support for export functionality
      console.log(`Exporting ${activeReport} report as ${format}`);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getReportColumns = () => {
    switch (activeReport) {
      case 'sales':
        return [
          { key: 'staff_name', header: 'Staff Name', render: (value) => value },
          { key: 'brand_name', header: 'Brand', render: (value) => value },
          { key: 'sale_amount', header: 'Amount', render: (value) => `₹${value.toLocaleString()}` },
          { key: 'units_sold', header: 'Units', render: (value) => value },
          { key: 'sale_date', header: 'Date', render: (value) => new Date(value).toLocaleDateString() }
        ];
      case 'attendance':
        return [
          { key: 'staff_name', header: 'Staff Name', render: (value) => value },
          { key: 'date', header: 'Date', render: (value) => new Date(value).toLocaleDateString() },
          { key: 'check_in_time', header: 'Check In', render: (value) => value ? new Date(value).toLocaleTimeString() : 'N/A' },
          { key: 'check_out_time', header: 'Check Out', render: (value) => value ? new Date(value).toLocaleTimeString() : 'N/A' },
          { key: 'status', header: 'Status', render: (value) => (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {value.toUpperCase()}
            </span>
          )}
        ];
      case 'performance':
        return [
          { key: 'staff_name', header: 'Staff Name', render: (value) => value },
          { key: 'target_amount', header: 'Target', render: (value) => `₹${value.toLocaleString()}` },
          { key: 'achieved_amount', header: 'Achieved', render: (value) => `₹${value.toLocaleString()}` },
          { key: 'achievement_percentage', header: 'Performance', render: (value) => `${value.toFixed(1)}%` },
          { key: 'incentive_earned', header: 'Incentive', render: (value) => `₹${value.toLocaleString()}` }
        ];
      default:
        return [];
    }
  };

  const getCurrentData = () => {
    switch (activeReport) {
      case 'sales':
        return reportData.sales || [];
      case 'attendance':
        return reportData.attendance || [];
      case 'performance':
        return reportData.performance || [];
      default:
        return [];
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
            <div className="flex space-x-2">
              <MobileButton
                onClick={() => exportReport('csv')}
                variant="secondary"
                size="md"
              >
                Export CSV
              </MobileButton>
              <MobileButton
                onClick={() => exportReport('pdf')}
                variant="primary"
                size="md"
              >
                Export PDF
              </MobileButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Report Type Selection */}
          <MobileCard className="p-0">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveReport('sales')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeReport === 'sales'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sales Report
                </button>
                <button
                  onClick={() => setActiveReport('attendance')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeReport === 'attendance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Attendance Report
                </button>
                <button
                  onClick={() => setActiveReport('performance')}
                  className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 ${
                    activeReport === 'performance'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Performance Report
                </button>
              </nav>
            </div>
          </MobileCard>

          {/* Date Filters */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filter Report Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MobileInput
                label="Start Date"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
              <MobileInput
                label="End Date"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
              <MobileButton
                onClick={handleDateFilter}
                variant="primary"
                size="md"
                className="h-10"
              >
                Apply Filter
              </MobileButton>
              <MobileButton
                onClick={clearFilters}
                variant="secondary"
                size="md"
                className="h-10"
              >
                Clear
              </MobileButton>
            </div>
          </MobileCard>

          {/* Summary Cards */}
          {Object.keys(summary).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeReport === 'sales' && (
                <>
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
                          ₹{summary.totalSales?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Units</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.totalUnits || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Average Sale</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{summary.avgSale?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Top Performer</p>
                        <p className="text-lg font-bold text-gray-900">
                          {summary.topPerformer?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{summary.topPerformer?.amount?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>
                </>
              )}

              {activeReport === 'attendance' && (
                <>
                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.attendanceRate?.toFixed(1) || '0'}%
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Present Days</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.presentDays || '0'} / {summary.totalDays || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Staff Count</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.staffCount || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>
                </>
              )}

              {activeReport === 'performance' && (
                <>
                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Avg Performance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.avgPerformance?.toFixed(1) || '0'}%
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Target</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{summary.totalTarget?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Achieved</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{summary.totalAchieved?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Staff Count</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.totalStaff || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>
                </>
              )}
            </div>
          </MobileCard>

          {/* Report Data Table */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Report Data
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Detailed {activeReport} data for the selected period
              </p>
            </div>
            
            <div className="p-6">
              {getCurrentData().length > 0 ? (
                <MobileTable
                  data={getCurrentData()}
                  columns={getReportColumns()}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No data available for the selected period</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;