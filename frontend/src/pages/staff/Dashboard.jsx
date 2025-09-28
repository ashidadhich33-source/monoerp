import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      if (user) {
        const data = await apiService.getStaffDashboard(user.staff_id);
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await apiService.checkIn();
      fetchDashboardData();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await apiService.checkOut();
      fetchDashboardData();
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-500">Check In/Out</p>
                  <div className="mt-2">
                    {dashboardData?.today_attendance ? (
                      <div className="flex space-x-2">
                        {!dashboardData.today_attendance.check_out_time && (
                          <MobileButton
                            onClick={handleCheckOut}
                            variant="danger"
                            size="sm"
                          >
                            Check Out
                          </MobileButton>
                        )}
                      </div>
                    ) : (
                      <MobileButton
                        onClick={handleCheckIn}
                        variant="success"
                        size="sm"
                      >
                        Check In
                      </MobileButton>
                    )}
                  </div>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Today's Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{dashboardData?.personal_sales_today?.toLocaleString() || '0'}
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
                  <p className="text-sm font-medium text-gray-500">Monthly Sales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{dashboardData?.personal_sales_month?.toLocaleString() || '0'}
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
                  <p className="text-sm font-medium text-gray-500">Achievement</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData?.achievement_percentage?.toFixed(1) || '0'}%
                  </p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Target Progress */}
          {dashboardData?.current_target && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Target Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Target: ₹{dashboardData.current_target.total_target_amount?.toLocaleString()}</span>
                    <span>{dashboardData.achievement_percentage?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(dashboardData.achievement_percentage || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Achieved: ₹{dashboardData.personal_sales_month?.toLocaleString() || '0'} of ₹{dashboardData.current_target.total_target_amount?.toLocaleString()}
                </p>
              </div>
            </MobileCard>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MobileCard 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/staff/attendance'}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Attendance</h3>
                  <p className="text-sm text-gray-500">View and manage your attendance</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/staff/sales'}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Sales</h3>
                  <p className="text-sm text-gray-500">View your sales performance</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/staff/rankings'}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 00-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Rankings</h3>
                  <p className="text-sm text-gray-500">View team rankings</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard 
              className="p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => window.location.href = '/staff/salary'}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Salary</h3>
                  <p className="text-sm text-gray-500">View salary details</p>
                </div>
              </div>
            </MobileCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;