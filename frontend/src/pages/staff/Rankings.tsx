import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface RankingRecord {
  rank: number;
  staff_name: string;
  total_sales: number;
  period_date: string;
}

const StaffRankings: React.FC = () => {
  const { user, logout } = useAuth();
  const [rankings, setRankings] = useState<RankingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

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

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return 'Monthly';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50';
    if (rank === 2) return 'text-gray-600 bg-gray-50';
    if (rank === 3) return 'text-orange-600 bg-orange-50';
    return 'text-gray-500 bg-gray-50';
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Rankings</h1>
              <p className="text-gray-600">View team performance rankings</p>
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
          {/* Period Selection */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Select Ranking Period
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      selectedPeriod === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getPeriodLabel(period)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rankings Leaderboard */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {getPeriodLabel(selectedPeriod)} Rankings
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Team performance rankings for {getPeriodLabel(selectedPeriod).toLowerCase()} period
              </p>
            </div>
            
            {rankings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {rankings.map((ranking, index) => (
                  <div key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
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
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No rankings data available for this period</p>
              </div>
            )}
          </div>

          {/* Top Performers Summary */}
          {rankings.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Performer */}
              {rankings[0] && (
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg p-6 text-white">
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
                </div>
              )}

              {/* Second Place */}
              {rankings[1] && (
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-lg p-6 text-white">
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
                </div>
              )}

              {/* Third Place */}
              {rankings[2] && (
                <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg p-6 text-white">
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
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffRankings;