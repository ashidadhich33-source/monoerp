import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface AttendanceRecord {
  id: number;
  check_in_time: string | null;
  check_out_time: string | null;
  date: string;
  status: string;
  created_at: string;
}

const StaffAttendance: React.FC = () => {
  const { user, logout } = useAuth();
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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

  const todayAttendance = getTodayAttendance();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
              <p className="text-gray-600">Manage your daily attendance</p>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/staff"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Today's Attendance Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Today's Attendance
              </h3>
              
              {todayAttendance ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="mt-6 flex justify-center space-x-4">
                {!todayAttendance?.check_in_time && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-md text-sm font-medium"
                  >
                    {checkingIn ? 'Checking In...' : 'Check In'}
                  </button>
                )}
                
                {todayAttendance?.check_in_time && !todayAttendance?.check_out_time && (
                  <button
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-md text-sm font-medium"
                  >
                    {checkingOut ? 'Checking Out...' : 'Check Out'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Attendance History (Last 30 Days)
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Your recent attendance records
              </p>
            </div>
            
            {attendanceHistory.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {attendanceHistory.map((record) => (
                  <li key={record.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
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
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No attendance records found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAttendance;