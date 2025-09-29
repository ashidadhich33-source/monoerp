import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';
import MobileTable from '../../components/MobileTable';
import { 
  Trophy, 
  Medal, 
  Award, 
  TrendingUp, 
  Users, 
  Calendar,
  Crown,
  Star,
  Filter,
  Search,
  Download
} from 'lucide-react';

const Rankings = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState('monthly'); // weekly, monthly, quarterly, yearly
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRankings();
  }, [periodType]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct rankings endpoint, we'll simulate the data
      // In a real implementation, you would call apiService.getRankings(periodType)
      const mockRankings = [
        {
          id: 1,
          staff_id: 1,
          staff_name: 'John Doe',
          period_type: 'monthly',
          period_date: '2024-01-01',
          total_sales: 75000,
          rank_position: 1,
          created_at: '2024-01-31T10:00:00Z'
        },
        {
          id: 2,
          staff_id: 2,
          staff_name: 'Jane Smith',
          period_type: 'monthly',
          period_date: '2024-01-01',
          total_sales: 68000,
          rank_position: 2,
          created_at: '2024-01-31T10:00:00Z'
        },
        {
          id: 3,
          staff_id: 3,
          staff_name: 'Mike Johnson',
          period_type: 'monthly',
          period_date: '2024-01-01',
          total_sales: 55000,
          rank_position: 3,
          created_at: '2024-01-31T10:00:00Z'
        },
        {
          id: 4,
          staff_id: 4,
          staff_name: 'Sarah Wilson',
          period_type: 'monthly',
          period_date: '2024-01-01',
          total_sales: 48000,
          rank_position: 4,
          created_at: '2024-01-31T10:00:00Z'
        },
        {
          id: 5,
          staff_id: 5,
          staff_name: 'David Brown',
          period_type: 'monthly',
          period_date: '2024-01-01',
          total_sales: 42000,
          rank_position: 5,
          created_at: '2024-01-31T10:00:00Z'
        }
      ];
      setRankings(mockRankings);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position) => {
    switch (position) {
      case 1:
        return { icon: Crown, color: 'text-yellow-500', bgColor: 'bg-yellow-50' };
      case 2:
        return { icon: Medal, color: 'text-gray-500', bgColor: 'bg-gray-50' };
      case 3:
        return { icon: Award, color: 'text-orange-500', bgColor: 'bg-orange-50' };
      default:
        return { icon: Trophy, color: 'text-blue-500', bgColor: 'bg-blue-50' };
    }
  };

  const getRankBadge = (position) => {
    if (position <= 3) {
      return { text: `#${position}`, color: 'text-white bg-gradient-to-r from-yellow-400 to-yellow-600' };
    } else if (position <= 10) {
      return { text: `#${position}`, color: 'text-white bg-gradient-to-r from-blue-400 to-blue-600' };
    } else {
      return { text: `#${position}`, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const filteredRankings = rankings.filter(ranking => {
    const matchesSearch = ranking.staff_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const totalParticipants = rankings.length;
  const topPerformer = rankings.find(r => r.rank_position === 1);
  const averageSales = rankings.length > 0 
    ? rankings.reduce((sum, r) => sum + r.total_sales, 0) / rankings.length 
    : 0;

  if (loading) {
    return <MobileLoading fullScreen text="Loading rankings..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rankings</h1>
              <p className="text-gray-600">Staff performance rankings and leaderboards</p>
            </div>
            <div className="flex space-x-3">
              <MobileButton
                onClick={() => {/* Export functionality */}}
                variant="secondary"
                size="md"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </MobileButton>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Participants</p>
                  <p className="text-2xl font-bold text-gray-900">{totalParticipants}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Crown className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top Performer</p>
                  <p className="text-lg font-bold text-gray-900">{topPerformer?.staff_name || 'N/A'}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top Sales</p>
                  <p className="text-2xl font-bold text-gray-900">₹{topPerformer?.total_sales.toLocaleString() || '0'}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Average Sales</p>
                  <p className="text-2xl font-bold text-gray-900">₹{averageSales.toLocaleString()}</p>
                </div>
              </div>
            </MobileCard>
          </div>

          {/* Filters and Search */}
          <MobileCard className="p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <MobileButton
                  onClick={() => setPeriodType('weekly')}
                  variant={periodType === 'weekly' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Weekly
                </MobileButton>
                <MobileButton
                  onClick={() => setPeriodType('monthly')}
                  variant={periodType === 'monthly' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Monthly
                </MobileButton>
                <MobileButton
                  onClick={() => setPeriodType('quarterly')}
                  variant={periodType === 'quarterly' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Quarterly
                </MobileButton>
                <MobileButton
                  onClick={() => setPeriodType('yearly')}
                  variant={periodType === 'yearly' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Yearly
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* Rankings List */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Rankings
            </h3>
            {filteredRankings.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No rankings found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRankings.map((ranking) => {
                  const rankIcon = getRankIcon(ranking.rank_position);
                  const rankBadge = getRankBadge(ranking.rank_position);
                  const IconComponent = rankIcon.icon;
                  
                  return (
                    <div key={ranking.id} className={`p-4 border rounded-lg ${ranking.rank_position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 'bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center justify-center w-12 h-12 rounded-full ${rankIcon.bgColor}`}>
                            <IconComponent className={`h-6 w-6 ${rankIcon.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-medium text-gray-900">
                                {ranking.staff_name}
                              </h4>
                              <span className={`px-3 py-1 text-sm font-bold rounded-full ${rankBadge.color}`}>
                                {rankBadge.text}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Total Sales: ₹{ranking.total_sales.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ₹{ranking.total_sales.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(ranking.period_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default Rankings;