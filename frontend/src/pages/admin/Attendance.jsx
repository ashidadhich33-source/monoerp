import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileLoading from '../../components/MobileLoading';

const AdminAttendance = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedStaff, setSelectedStaff] = useState('');
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchAttendanceData();
    fetchStaffList();
  }, [dateRange, selectedStaff]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = dateRange;
      const data = await apiService.getAllStaffAttendance(startDate, endDate);
      setAttendanceData(data);
      calculateSummary(data);
    } catch (error) {
      console.error('Failed to fetch attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const data = await apiService.getStaffList();
      setStaffList(data);
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
    }
  };

  const calculateSummary = (data) => {
    if (!data || data.length === 0) {
      setSummary({});
      return;
    }

    const totalRecords = data.length;
    const presentCount = data.filter(record => record.status === 'present').length;
    const absentCount = data.filter(record => record.status === 'absent').length;
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

    // Group by staff
    const staffStats = data.reduce((acc, record) => {
      const staffName = record.staff_name;
      if (!acc[staffName]) {
        acc[staffName] = { present: 0, total: 0, late: 0 };
      }
      acc[staffName].total += 1;
      if (record.status === 'present') {
        acc[staffName].present += 1;
      }
      // Check for late arrivals (assuming check-in after 9:30 AM is late)
      if (record.check_in_time) {
        const checkInTime = new Date(record.check_in_time);
        const lateTime = new Date(checkInTime);
        lateTime.setHours(9, 30, 0, 0);
        if (checkInTime > lateTime) {
          acc[staffName].late += 1;
        }
      }
      return acc;
    }, {});

    setSummary({
      totalRecords,
      presentCount,
      absentCount,
      attendanceRate,
      staffStats
    });
  };

  const handleDateFilter = () => {
    fetchAttendanceData();
  };

  const handleStaffFilter = (staffId) => {
    setSelectedStaff(staffId);
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
    setSelectedStaff('');
  };

  const updateAttendance = async (attendanceId, status) => {
    try {
      await apiService.updateAttendance(attendanceId, { status });
      fetchAttendanceData();
    } catch (error) {
      console.error('Failed to update attendance:', error);
    }
  };

  const exportAttendance = async (format = 'csv') => {
    try {
      // This would need backend support for export functionality
      console.log(`Exporting attendance report as ${format}`);
    } catch (error) {
      console.error('Failed to export attendance:', error);
    }
  };

  const getFilteredData = () => {
    let filtered = attendanceData;

    if (selectedStaff) {
      const staff = staffList.find(s => s.id.toString() === selectedStaff);
      if (staff) {
        filtered = filtered.filter(record => record.staff_name === staff.name);
      }
    }

    return filtered;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (record) => {
    let status = record.status;
    
    // Check if present but late
    if (status === 'present' && record.check_in_time) {
      const checkInTime = new Date(record.check_in_time);
      const lateTime = new Date(checkInTime);
      lateTime.setHours(9, 30, 0, 0);
      if (checkInTime > lateTime) {
        status = 'late';
      }
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading attendance data..." />;
  }

  const tableColumns = [
    {
      key: 'staff_name',
      header: 'Staff Name',
      render: (value) => value
    },
    {
      key: 'date',
      header: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'check_in_time',
      header: 'Check In',
      render: (value) => value ? new Date(value).toLocaleTimeString() : 'N/A'
    },
    {
      key: 'check_out_time',
      header: 'Check Out',
      render: (value) => value ? new Date(value).toLocaleTimeString() : 'N/A'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, record) => getStatusBadge(record)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value, record) => (
        <div className="flex space-x-2">
          {record.status === 'absent' && (
            <MobileButton
              onClick={() => updateAttendance(record.id, 'present')}
              variant="success"
              size="sm"
            >
              Mark Present
            </MobileButton>
          )}
          {record.status === 'present' && (
            <MobileButton
              onClick={() => updateAttendance(record.id, 'absent')}
              variant="danger"
              size="sm"
            >
              Mark Absent
            </MobileButton>
          )}
        </div>
      )
    }
  ];

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-sm text-gray-600">View and manage all staff attendance records</p>
            </div>
            <div className="flex space-x-2">
              <MobileButton
                onClick={() => exportAttendance('csv')}
                variant="secondary"
                size="md"
              >
                Export CSV
              </MobileButton>
              <MobileButton
                onClick={() => exportAttendance('pdf')}
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
          {/* Filters */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filter Attendance Data
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Staff</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <MobileButton
                  onClick={handleDateFilter}
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
          {Object.keys(summary).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MobileCard className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                    <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
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
            </div>
          )}

          {/* Staff Performance Summary */}
          {summary.staffStats && Object.keys(summary.staffStats).length > 0 && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Staff Performance Summary</h3>
              <div className="space-y-3">
                {Object.entries(summary.staffStats).map(([staffName, stats]) => {
                  const attendanceRate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
                  return (
                    <div key={staffName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{staffName}</p>
                        <p className="text-sm text-gray-500">
                          {stats.present}/{stats.total} days ({attendanceRate.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Late: {stats.late}</p>
                        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </MobileCard>
          )}

          {/* Attendance Table */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance Records ({filteredData.length})
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Detailed attendance records for all staff members
              </p>
            </div>
            
            <div className="p-6">
              {filteredData.length > 0 ? (
                <MobileTable
                  data={filteredData}
                  columns={tableColumns}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance records found for the selected criteria</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;