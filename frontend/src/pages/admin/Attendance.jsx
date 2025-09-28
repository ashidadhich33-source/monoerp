import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileInput from '../../components/MobileInput';
import MobileTable from '../../components/MobileTable';
import MobileModal from '../../components/MobileModal';
import MobileLoading from '../../components/MobileLoading';

const AdminAttendance = () => {
  const { user, logout } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormData, setManualFormData] = useState({
    staff_id: '',
    status: 'present',
    check_in_time: '',
    check_out_time: '',
    notes: ''
  });

  useEffect(() => {
    fetchAttendanceRecords();
    fetchStaffList();
  }, [selectedDate]);

  const fetchAttendanceRecords = async () => {
    try {
      const data = await apiService.getAttendanceRecords(selectedDate);
      setAttendanceRecords(data);
    } catch (error) {
      console.error('Failed to fetch attendance records:', error);
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

  const handleManualMarking = async (staffId, status) => {
    try {
      await apiService.manualMarkAttendance(staffId, selectedDate, status);
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
    }
  };

  const handleManualFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiService.createManualAttendance(manualFormData);
      setShowManualForm(false);
      setManualFormData({
        staff_id: '',
        status: 'present',
        check_in_time: '',
        check_out_time: '',
        notes: ''
      });
      fetchAttendanceRecords();
    } catch (error) {
      console.error('Failed to create manual attendance:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setManualFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'half_day': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
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
      key: 'check_in_time',
      header: 'Check In',
      render: (value) => value ? new Date(value).toLocaleTimeString() : 'Not checked in'
    },
    {
      key: 'check_out_time',
      header: 'Check Out',
      render: (value) => value ? new Date(value).toLocaleTimeString() : 'Not checked out'
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.replace('_', ' ').toUpperCase()}
        </span>
      )
    }
  ];

  const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
  const absentCount = attendanceRecords.filter(record => record.status === 'absent').length;
  const halfDayCount = attendanceRecords.filter(record => record.status === 'half_day').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-sm text-gray-600">View and manage all staff attendance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Date Filter and Actions */}
          <MobileCard className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center space-x-4">
                <MobileInput
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
                <MobileButton
                  onClick={fetchAttendanceRecords}
                  variant="secondary"
                  size="md"
                >
                  Refresh
                </MobileButton>
              </div>
              <MobileButton
                onClick={() => setShowManualForm(true)}
                variant="primary"
                size="md"
              >
                Manual Marking
              </MobileButton>
            </div>
          </MobileCard>

          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Present Today</p>
                  <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Absent Today</p>
                  <p className="text-2xl font-bold text-gray-900">{absentCount}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Half Day</p>
                  <p className="text-2xl font-bold text-gray-900">{halfDayCount}</p>
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
                  <p className="text-sm font-medium text-gray-500">Total Staff</p>
                  <p className="text-2xl font-bold text-gray-900">{staffList.length}</p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Attendance Records */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance Records for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              <p className="text-sm text-gray-500 mt-1">All staff attendance for the selected date</p>
            </div>
            
            <div className="p-6">
              {attendanceRecords.length > 0 ? (
                <MobileTable
                  data={attendanceRecords}
                  columns={tableColumns}
                  actions={[
                    {
                      label: 'Mark Present',
                      onClick: (item) => handleManualMarking(item.staff_id, 'present'),
                      variant: 'success',
                      size: 'sm',
                      condition: (item) => item.status !== 'present'
                    },
                    {
                      label: 'Mark Absent',
                      onClick: (item) => handleManualMarking(item.staff_id, 'absent'),
                      variant: 'danger',
                      size: 'sm',
                      condition: (item) => item.status !== 'absent'
                    }
                  ]}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No attendance records found for this date</p>
                </div>
              )}
            </div>
          </MobileCard>
        </div>
      </div>

      {/* Manual Marking Modal */}
      <MobileModal
        isOpen={showManualForm}
        onClose={() => setShowManualForm(false)}
        title="Manual Attendance Marking"
      >
        <form onSubmit={handleManualFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
              <select
                name="staff_id"
                value={manualFormData.staff_id}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Staff Member</option>
                {staffList.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={manualFormData.status}
                onChange={handleInputChange}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
            <MobileInput
              label="Check In Time"
              name="check_in_time"
              type="time"
              value={manualFormData.check_in_time}
              onChange={handleInputChange}
            />
            <MobileInput
              label="Check Out Time"
              name="check_out_time"
              type="time"
              value={manualFormData.check_out_time}
              onChange={handleInputChange}
            />
            <MobileInput
              label="Notes"
              name="notes"
              value={manualFormData.notes}
              onChange={handleInputChange}
              placeholder="Additional notes (optional)"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <MobileButton
              type="button"
              onClick={() => setShowManualForm(false)}
              variant="secondary"
              size="md"
            >
              Cancel
            </MobileButton>
            <MobileButton
              type="submit"
              variant="primary"
              size="md"
            >
              Mark Attendance
            </MobileButton>
          </div>
        </form>
      </MobileModal>
    </div>
  );
};

export default AdminAttendance;