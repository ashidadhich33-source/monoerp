import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';
import MobileTable from '../../components/MobileTable';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Users, 
  Calendar,
  Award,
  Star,
  Filter,
  Search,
  Download
} from 'lucide-react';

const Achievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, this_month, this_quarter, this_year
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');

  useEffect(() => {
    fetchAchievements();
    fetchStaffList();
  }, [filter, selectedStaff]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct achievements endpoint, we'll simulate the data
      // In a real implementation, you would call apiService.getAchievements()
      const mockAchievements = [
        {
          id: 1,
          staff_id: 1,
          staff_name: 'John Doe',
          target_id: 1,
          achieved_amount: 50000,
          achievement_percentage: 125.0,
          incentive_earned: 5000,
          period: '2024-01',
          created_at: '2024-01-31T10:00:00Z'
        },
        {
          id: 2,
          staff_id: 2,
          staff_name: 'Jane Smith',
          target_id: 2,
          achieved_amount: 45000,
          achievement_percentage: 112.5,
          incentive_earned: 4500,
          period: '2024-01',
          created_at: '2024-01-31T10:00:00Z'
        },
        {
          id: 3,
          staff_id: 3,
          staff_name: 'Mike Johnson',
          target_id: 3,
          achieved_amount: 38000,
          achievement_percentage: 95.0,
          incentive_earned: 0,
          period: '2024-01',
          created_at: '2024-01-31T10:00:00Z'
        }
      ];
      setAchievements(mockAchievements);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const response = await apiService.getStaffList(0, 100);
      setStaffList(response.staff || response);
    } catch (error) {
      console.error('Failed to fetch staff list:', error);
    }
  };

  const getAchievementLevel = (percentage) => {
    if (percentage >= 150) return { level: 'Exceptional', color: 'text-purple-600 bg-purple-50', icon: Star };
    if (percentage >= 125) return { level: 'Excellent', color: 'text-green-600 bg-green-50', icon: Trophy };
    if (percentage >= 100) return { level: 'Achieved', color: 'text-blue-600 bg-blue-50', icon: Target };
    if (percentage >= 75) return { level: 'Good', color: 'text-yellow-600 bg-yellow-50', icon: TrendingUp };
    return { level: 'Needs Improvement', color: 'text-red-600 bg-red-50', icon: Target };
  };

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.staff_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStaff = selectedStaff === 'all' || achievement.staff_id.toString() === selectedStaff;
    return matchesSearch && matchesStaff;
  });

  const totalAchievements = achievements.length;
  const achievedTargets = achievements.filter(a => a.achievement_percentage >= 100).length;
  const totalIncentiveEarned = achievements.reduce((sum, a) => sum + a.incentive_earned, 0);
  const averagePerformance = achievements.length > 0 
    ? achievements.reduce((sum, a) => sum + a.achievement_percentage, 0) / achievements.length 
    : 0;

  if (loading) {
    return <MobileLoading fullScreen text="Loading achievements..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Achievements</h1>
              <p className="text-gray-600">Track staff performance and achievements</p>
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
                  <Trophy className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Achievements</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAchievements}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Targets Achieved</p>
                  <p className="text-2xl font-bold text-gray-900">{achievedTargets}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Incentive</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalIncentiveEarned.toLocaleString()}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Performance</p>
                  <p className="text-2xl font-bold text-gray-900">{averagePerformance.toFixed(1)}%</p>
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
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Staff</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.name}</option>
                  ))}
                </select>
                <MobileButton
                  onClick={() => setFilter('this_month')}
                  variant={filter === 'this_month' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  This Month
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('this_quarter')}
                  variant={filter === 'this_quarter' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  This Quarter
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('this_year')}
                  variant={filter === 'this_year' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  This Year
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* Achievements List */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Records</h3>
            {filteredAchievements.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No achievements found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAchievements.map((achievement) => {
                  const achievementLevel = getAchievementLevel(achievement.achievement_percentage);
                  const IconComponent = achievementLevel.icon;
                  
                  return (
                    <div key={achievement.id} className="p-4 border rounded-lg bg-white">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <IconComponent className="h-6 w-6 text-yellow-500" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {achievement.staff_name}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${achievementLevel.color}`}>
                                {achievementLevel.level}
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Achieved Amount</p>
                                <p className="font-medium">₹{achievement.achieved_amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Performance</p>
                                <p className="font-medium">{achievement.achievement_percentage.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Incentive Earned</p>
                                <p className="font-medium">₹{achievement.incentive_earned.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Period</p>
                                <p className="font-medium">{achievement.period}</p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Recorded: {new Date(achievement.created_at).toLocaleString()}
                            </div>
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

export default Achievements;