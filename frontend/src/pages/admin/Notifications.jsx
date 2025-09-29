import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import MobileCard from '../../components/MobileCard';
import MobileButton from '../../components/MobileButton';
import MobileLoading from '../../components/MobileLoading';
import MobileTable from '../../components/MobileTable';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Send, 
  AlertTriangle,
  Info,
  X,
  Filter,
  Search
} from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchNotifications();
    fetchStatistics();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications(50, 0, filter === 'unread');
      setNotifications(response.notifications || response);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiService.getNotificationStatistics();
      setStatistics(response);
    } catch (error) {
      console.error('Failed to fetch notification statistics:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true, read_at: new Date().toISOString() }
          : notification
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setNotifications(notifications.map(notification => ({
        ...notification,
        is_read: true,
        read_at: new Date().toISOString()
      })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const sendAttendanceReminder = async (staffId) => {
    try {
      await apiService.sendAttendanceReminder(staffId);
      alert('Attendance reminder sent successfully');
    } catch (error) {
      console.error('Failed to send attendance reminder:', error);
    }
  };

  const sendSystemAlert = async () => {
    const message = prompt('Enter alert message:');
    if (message) {
      try {
        await apiService.sendSystemAlert(message);
        alert('System alert sent successfully');
      } catch (error) {
        console.error('Failed to send system alert:', error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'reminder':
        return <Bell className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 bg-red-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'normal':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return <MobileLoading fullScreen text="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">Manage system notifications and alerts</p>
            </div>
            <div className="flex space-x-3">
              <MobileButton
                onClick={sendSystemAlert}
                variant="primary"
                size="md"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Alert
              </MobileButton>
              <MobileButton
                onClick={markAllAsRead}
                variant="secondary"
                size="md"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
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
                  <Bell className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.total || 0}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.unread || 0}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Read</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.read || 0}</p>
                </div>
              </div>
            </MobileCard>

            <MobileCard className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Urgent</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.urgent || 0}</p>
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
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <MobileButton
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  All
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('unread')}
                  variant={filter === 'unread' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Unread
                </MobileButton>
                <MobileButton
                  onClick={() => setFilter('read')}
                  variant={filter === 'read' ? 'primary' : 'secondary'}
                  size="sm"
                >
                  Read
                </MobileButton>
              </div>
            </div>
          </MobileCard>

          {/* Notifications List */}
          <MobileCard className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg ${
                      notification.is_read ? 'bg-gray-50' : 'bg-white border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.notification_type)}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            {!notification.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            {notification.read_at && (
                              <span>Read: {new Date(notification.read_at).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.is_read && (
                          <MobileButton
                            onClick={() => markAsRead(notification.id)}
                            variant="secondary"
                            size="sm"
                          >
                            <Check className="h-4 w-4" />
                          </MobileButton>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </MobileCard>
        </div>
      </div>
    </div>
  );
};

export default Notifications;