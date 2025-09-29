import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileLoading from '../../components/MobileLoading';
import { downloadCSV, downloadPDF, generateFilename } from '../../utils/fileDownload';

const AdminReports = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchReportData();
  }, [activeReport, dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      let response, data, summaryData;
      
      if (activeReport === 'sales') {
        response = await apiService.getSalesReport(dateRange.startDate, dateRange.endDate);
        data = response.data || response;
        summaryData = response.summary || {
          totalSales: data.reduce((sum, item) => sum + (item.amount || 0), 0),
          totalRecords: data.length,
          averageSale: data.length > 0 ? data.reduce((sum, item) => sum + (item.amount || 0), 0) / data.length : 0
        };
      } else if (activeReport === 'attendance') {
        response = await apiService.getAttendanceReport(dateRange.startDate, dateRange.endDate);
        data = response.data || response;
        summaryData = {
          totalRecords: data.length,
          presentCount: data.filter(item => item.status === 'present').length,
          absentCount: data.filter(item => item.status === 'absent').length
        };
      } else if (activeReport === 'performance') {
        response = await apiService.getPerformanceReport(dateRange.startDate, dateRange.endDate);
        data = response.data || response;
        summaryData = response.summary || {
          totalStaff: data.length,
          totalSales: data.reduce((sum, item) => sum + (item.total_sales || 0), 0),
          averagePerformance: data.length > 0 ? data.reduce((sum, item) => sum + (item.target_achievement || 0), 0) / data.length : 0
        };
      }
      
      setReportData(data);
      setSummary(summaryData);
    } catch (error) {
      console.error(`Failed to fetch ${activeReport} report:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  const exportReport = async (format) => {
    try {
      let blob;
      let filename;
      
      if (activeReport === 'sales') {
        if (format === 'csv') {
          blob = await apiService.exportSalesCSV(dateRange.startDate, dateRange.endDate);
          filename = generateFilename('sales_report', 'csv');
          downloadCSV(blob, filename);
        } else if (format === 'pdf') {
          blob = await apiService.exportSalesPDF(dateRange.startDate, dateRange.endDate);
          filename = generateFilename('sales_report', 'pdf');
          downloadPDF(blob, filename);
        }
      } else if (activeReport === 'attendance') {
        if (format === 'csv') {
          blob = await apiService.exportAttendanceCSV(dateRange.startDate, dateRange.endDate);
          filename = generateFilename('attendance_report', 'csv');
          downloadCSV(blob, filename);
        } else if (format === 'pdf') {
          blob = await apiService.exportAttendancePDF(dateRange.startDate, dateRange.endDate);
          filename = generateFilename('attendance_report', 'pdf');
          downloadPDF(blob, filename);
        }
      } else if (activeReport === 'performance') {
        // For performance reports, we'll export as CSV for now
        if (format === 'csv') {
          // Convert performance data to CSV format
          const csvData = reportData.map(item => ({
            'Staff Name': item.staff_name,
            'Total Sales': item.total_sales,
            'Target Achieved': `${item.target_achieved.toFixed(2)}%`,
            'Incentive Earned': item.incentive_earned
          }));
          
          // Create CSV content
          const headers = Object.keys(csvData[0] || {});
          const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => row[header]).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          filename = generateFilename('performance_report', 'csv');
          downloadCSV(blob, filename);
        } else if (format === 'pdf') {
          // For PDF, we'll use the same data but format it for PDF
          const pdfData = reportData.map(item => ({
            staff_name: item.staff_name,
            total_sales: `₹${item.total_sales.toLocaleString()}`,
            target_achieved: `${item.target_achieved.toFixed(2)}%`,
            incentive_earned: `₹${item.incentive_earned.toLocaleString()}`
          }));
          
          // For now, we'll create a simple CSV and convert to PDF
          // In a real implementation, you'd want a proper PDF generation service
          const headers = ['Staff Name', 'Total Sales', 'Target Achieved', 'Incentive Earned'];
          const csvContent = [
            headers.join(','),
            ...pdfData.map(row => Object.values(row).join(','))
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          filename = generateFilename('performance_report', 'csv');
          downloadCSV(blob, filename);
        }
      }
      
      // Show success message
      alert(`${activeReport} report exported successfully as ${format.toUpperCase()}`);
      
    } catch (error) {
      console.error(`Failed to export ${activeReport} report:`, error);
      alert(`Failed to export ${activeReport} report. Please try again.`);
    }
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading report data..." />;
  }

  const getTableColumns = () => {
    switch (activeReport) {
      case 'sales':
        return [
          { key: 'staff_name', header: 'Staff Name', render: (value) => value },
          { key: 'brand_name', header: 'Brand', render: (value) => value },
          { key: 'sale_amount', header: 'Amount', render: (value) => `₹${value.toLocaleString()}` },
          { key: 'sale_date', header: 'Date', render: (value) => new Date(value).toLocaleDateString() },
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
              {value}
            </span>
          )},
        ];
      case 'performance':
        return [
          { key: 'staff_name', header: 'Staff Name', render: (value) => value },
          { key: 'total_sales', header: 'Total Sales', render: (value) => `₹${value.toLocaleString()}` },
          { key: 'target_achieved', header: 'Target Achieved', render: (value) => `${value.toFixed(2)}%` },
          { key: 'incentive_earned', header: 'Incentive', render: (value) => `₹${value.toLocaleString()}` },
        ];
      default:
        return [];
    }
  };

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

          {/* Date Range Filter */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MobileInput
                label="Start Date"
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
              />
              <MobileInput
                label="End Date"
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
              />
              <div className="flex items-end space-x-2">
                <MobileButton
                  onClick={fetchReportData}
                  variant="primary"
                  size="md"
                  className="flex-1"
                >
                  Apply Filter
                </MobileButton>
                <MobileButton
                  onClick={clearFilters}
                  variant="secondary"
                  size="md"
                  className="flex-1"
                >
                  Clear
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* Summary Cards */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} Summary
            </h3>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Records</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.totalRecords || '0'}
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
                          ₹{summary.averageSale?.toLocaleString() || '0'}
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
                        <p className="text-sm font-medium text-gray-500">Present</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.presentCount || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Absent</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.absentCount || '0'}
                        </p>
                      </div>
                    </div>
                  </MobileCard>

                  <MobileCard className="p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Records</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.totalRecords || '0'}
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
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
                        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Average Performance</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {summary.averagePerformance?.toFixed(1) || '0'}%
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
              {reportData.length > 0 ? (
                <MobileTable
                  data={reportData}
                  columns={getTableColumns()}
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