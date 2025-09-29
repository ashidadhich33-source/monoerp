import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';

const StaffRankings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState('monthly');
  const [rankings, setRankings] = useState([]);
  const [userRanking, setUserRanking] = useState(null);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    fetchRankings();
  }, [activePeriod]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const data = await apiService.getRankings(activePeriod);
      setRankings(data);
      calculateSummary(data);
      findUserRanking(data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data) => {
    if (!data || data.length === 0) {
      setSummary({});
      return;
    }

    const totalSales = data.reduce((sum, ranking) => sum + ranking.total_sales, 0);
    const avgSales = totalSales / data.length;
    const topPerformer = data[0]; // Assuming data is sorted by rank
    const totalStaff = data.length;

    setSummary({
      totalSales,
      avgSales,
      topPerformer,
      totalStaff
    });
  };

  const findUserRanking = (data) => {
    if (!user || !data) {
      setUserRanking(null);
      return;
    }

    const userRank = data.find(ranking => 
      ranking.staff_name === user.name || 
      ranking.staff_id === user.staff_id
    );
    setUserRanking(userRank);
  };

  const getRankIcon = (rank) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 rounded-full">
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    } else if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    } else if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full">
          <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <span className="text-sm font-bold text-blue-600">{rank}</span>
        </div>
      );
    }
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  if (loading) {
    return <MobileLoading fullScreen text="Loading rankings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Team Rankings</h1>
              <p className="text-sm text-gray-600">View team performance rankings and your position</p>
            </div>
            <div className="flex space-x-2">
              <MobileButton
                onClick={() => setActivePeriod('weekly')}
                variant={activePeriod === 'weekly' ? 'primary' : 'secondary'}
                size="sm"
              >
                Weekly
              </MobileButton>
              <MobileButton
                onClick={() => setActivePeriod('monthly')}
                variant={activePeriod === 'monthly' ? 'primary' : 'secondary'}
                size="sm"
              >
                Monthly
              </MobileButton>
              <MobileButton
                onClick={() => setActivePeriod('yearly')}
                variant={activePeriod === 'yearly' ? 'primary' : 'secondary'}
                size="sm"
              >
                Yearly
              </MobileButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Summary Cards */}
          {Object.keys(summary).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MobileCard className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Team Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.totalSales || 0)}
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
                    <p className="text-sm font-medium text-gray-500">Average Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(summary.avgSales || 0)}
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
                    <p className="text-sm font-medium text-gray-500">Team Size</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalStaff || '0'}
                    </p>
                  </div>
                </div>
              </MobileCard>
            </div>
          )}

          {/* Your Ranking Card */}
          {userRanking && (
            <MobileCard className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Your Ranking</h3>
                  <p className="text-sm text-gray-600">
                    {activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Performance
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(userRanking.rank)}
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        #{userRanking.rank}
                      </p>
                      <p className="text-sm text-gray-500">
                        of {summary.totalStaff} staff
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Your Sales</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(userRanking.total_sales)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Performance</p>
                  <p className="text-lg font-bold text-gray-900">
                    {((userRanking.total_sales / summary.totalSales) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </MobileCard>
          )}

          {/* Top Performers */}
          {summary.topPerformer && (
            <MobileCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Performer</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-yellow-600 bg-yellow-50">
                  #1
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{summary.topPerformer.staff_name}</p>
                  <p className="text-sm text-gray-500">
                    Sales: {formatCurrency(summary.topPerformer.total_sales)}
                  </p>
                </div>
              </div>
            </MobileCard>
          )}

          {/* Rankings List */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1)} Rankings
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Team performance rankings for the selected period
              </p>
            </div>
            
            <div className="p-6">
              {rankings.length > 0 ? (
                <div className="space-y-4">
                  {rankings.map((ranking, index) => (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        userRanking && ranking.staff_name === userRanking.staff_name
                          ? 'bg-blue-50 border-2 border-blue-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {getRankIcon(ranking.rank)}
                        <div>
                          <p className={`font-medium ${
                            userRanking && ranking.staff_name === userRanking.staff_name
                              ? 'text-blue-900'
                              : 'text-gray-900'
                          }`}>
                            {ranking.staff_name}
                            {userRanking && ranking.staff_name === userRanking.staff_name && (
                              <span className="ml-2 text-xs text-blue-600">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(ranking.period_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(ranking.total_sales)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankColor(ranking.rank)}`}>
                          Rank #{ranking.rank}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No rankings available for the selected period</p>
                </div>
              )}
            </div>
          </MobileCard>

          {/* Performance Insights */}
          {userRanking && (
            <MobileCard className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Your Position</span>
                  <span className="text-sm font-bold text-gray-900">
                    #{userRanking.rank} of {summary.totalStaff}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Team Contribution</span>
                  <span className="text-sm font-bold text-gray-900">
                    {((userRanking.total_sales / summary.totalSales) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Above Average</span>
                  <span className={`text-sm font-bold ${
                    userRanking.total_sales > summary.avgSales ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {userRanking.total_sales > summary.avgSales ? 'Yes' : 'No'}
                  </span>
                </div>
                {userRanking.rank > 1 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Gap to Next Rank</span>
                    <span className="text-sm font-bold text-gray-900">
                      {rankings[userRanking.rank - 2] ? 
                        formatCurrency(rankings[userRanking.rank - 2].total_sales - userRanking.total_sales) : 
                        'N/A'
                      }
                    </span>
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

export default StaffRankings;