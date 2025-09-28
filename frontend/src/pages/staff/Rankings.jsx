import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';

const StaffRankings = () => {
  const { user, logout } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  useEffect(() => {
    fetchRankings();
  }, [selectedPeriod]);

  const fetchRankings = async () => {
    try {
      const data = await apiService.getRankings(selectedPeriod);
      setRankings(data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return 'Monthly';
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-orange-600 bg-orange-50';
    return 'text-gray-500 bg-gray-50';
  };

  const getUserRank = () => {
    if (!user) return null;
    return rankings.find(ranking => ranking.staff_name === user.name);
  };

  const userRank = getUserRank();

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
              <h1 className="text-2xl font-bold text-gray-900">Rankings</h1>
              <p className="text-sm text-gray-600">View team performance rankings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">
          {/* Period Selection */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Select Ranking Period
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['weekly', 'monthly', 'quarterly', 'yearly'].map((period) => (
                <MobileButton
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  variant={selectedPeriod === period ? 'primary' : 'outline'}
                  size="md"
                  fullWidth
                >
                  {getPeriodLabel(period)}
                </MobileButton>
              ))}
            </div>
          </MobileCard>

          {/* Personal Position Highlight */}
          {userRank && (
            <MobileCard className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getRankColor(userRank.rank)}`}>
                    {getRankIcon(userRank.rank)}
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-blue-900">Your Position</h3>
                  <p className="text-sm text-blue-700">
                    You are ranked #{userRank.rank} with ₹{userRank.total_sales.toLocaleString()} in sales
                  </p>
                </div>
              </div>
            </MobileCard>
          )}

          {/* Rankings Leaderboard */}
          <MobileCard className="p-0">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {getPeriodLabel(selectedPeriod)} Rankings
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Team performance rankings for {getPeriodLabel(selectedPeriod).toLowerCase()} period
              </p>
            </div>
            
            <div className="p-6">
              {rankings.length > 0 ? (
                <div className="space-y-4">
                  {rankings.map((ranking, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getRankColor(ranking.rank)}`}>
                          {getRankIcon(ranking.rank)}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {ranking.staff_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Rank #{ranking.rank}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          ₹{ranking.total_sales.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Total Sales
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No rankings data available for this period</p>
                </div>
              )}
            </div>
          </MobileCard>

          {/* Top Performers Summary */}
          {rankings.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Top Performer */}
              {rankings[0] && (
                <MobileCard className="p-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">🥇</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">Top Performer</h3>
                      <p className="text-sm opacity-90">{rankings[0].staff_name}</p>
                      <p className="text-lg font-bold">₹{rankings[0].total_sales.toLocaleString()}</p>
                    </div>
                  </div>
                </MobileCard>
              )}

              {/* Second Place */}
              {rankings[1] && (
                <MobileCard className="p-6 bg-gradient-to-r from-gray-400 to-gray-500 text-white">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">🥈</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">Second Place</h3>
                      <p className="text-sm opacity-90">{rankings[1].staff_name}</p>
                      <p className="text-lg font-bold">₹{rankings[1].total_sales.toLocaleString()}</p>
                    </div>
                  </div>
                </MobileCard>
              )}

              {/* Third Place */}
              {rankings[2] && (
                <MobileCard className="p-6 bg-gradient-to-r from-orange-400 to-orange-500 text-white">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-3xl">🥉</span>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">Third Place</h3>
                      <p className="text-sm opacity-90">{rankings[2].staff_name}</p>
                      <p className="text-lg font-bold">₹{rankings[2].total_sales.toLocaleString()}</p>
                    </div>
                  </div>
                </MobileCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffRankings;