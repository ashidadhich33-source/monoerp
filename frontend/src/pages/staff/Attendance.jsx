import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import Calendar from '../../components/Calendar';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';

const StaffAttendance = () => {
  const { user, logout } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'

  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    try {
      const data = await apiService.getAttendanceHistory(30);
      setAttendanceHistory(data);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await apiService.checkIn();
      fetchAttendanceHistory();
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await apiService.checkOut();
      fetchAttendanceHistory();
    } catch (error) {
      console.error('Check-out failed:', error);
    } finally {
      setCheckingOut(false);
    }
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendanceHistory.find(record => record.date === today);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const todayAttendance = getTodayAttendance();

  if (loading) {
    return <MobileLoading fullScreen text="Loading attendance data..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
              <p className="text-sm text-gray-600">Manage your daily attendance</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Today's Attendance Card */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Today's Attendance
            </h3>
            
            {todayAttendance ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">Check In</p>
                      <p className="text-sm text-blue-600">
                        {todayAttendance.check_in_time 
                          ? new Date(todayAttendance.check_in_time).toLocaleTimeString()
                          : 'Not checked in'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">Check Out</p>
                      <p className="text-sm text-green-600">
                        {todayAttendance.check_out_time 
                          ? new Date(todayAttendance.check_out_time).toLocaleTimeString()
                          : 'Not checked out'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-800">Status</p>
                      <p className="text-sm text-purple-600 capitalize">
                        {todayAttendance.status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No attendance record for today</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!todayAttendance?.check_in_time && (
                <MobileButton
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  loading={checkingIn}
                  variant="success"
                  size="lg"
                  fullWidth
                >
                  {checkingIn ? 'Checking In...' : 'Check In'}
                </MobileButton>
              )}
              
              {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
                <MobileButton
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  loading={checkingOut}
                  variant="danger"
                  size="lg"
                  fullWidth
                >
                  {checkingOut ? 'Checking Out...' : 'Check Out'}
                </MobileButton>
              )}
            </div>
          </MobileCard>

          {/* Calendar or List View */}
          {viewMode === 'calendar' ? (
            <Calendar
              attendanceData={attendanceHistory}
              onDateSelect={handleDateSelect}
              selectedDate={selectedDate}
            />
          ) : (
            <MobileCard>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Attendance History (Last 30 Days)
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Your recent attendance records
                </p>
                
                {attendanceHistory.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceHistory.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`h-3 w-3 rounded-full ${
                              record.status === 'present' ? 'bg-green-400' : 
                              record.status === 'absent' ? 'bg-red-400' : 
                              'bg-yellow-400'
                            }`}></div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              Status: {record.status}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {record.check_in_time && (
                            <p className="text-sm text-gray-900">
                              In: {new Date(record.check_in_time).toLocaleTimeString()}
                            </p>
                          )}
                          {record.check_out_time && (
                            <p className="text-sm text-gray-500">
                              Out: {new Date(record.check_out_time).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No attendance records found</p>
                  </div>
                )}
              </div>
            </MobileCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffAttendance;