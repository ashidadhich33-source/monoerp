import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import MobileCard from './MobileCard';
import MobileButton from './MobileButton';
import MobileModal from './MobileModal';
import MobileLoading from './MobileLoading';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchStatistics();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiService.getNotifications(50, 0, activeTab === 'unread');
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await apiService.getNotificationStatistics();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch notification statistics:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'salary':
        return (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'achievement':
        return (
          <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'reminder':
        return (
          <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'system':
        return (
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
          </svg>
        );
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <MobileModal isOpen={isOpen} onClose={onClose} title="Notifications">
        <MobileLoading text="Loading notifications..." />
      </MobileModal>
    );
  }

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Notifications">
      <div className="space-y-4">
        {/* Statistics */}
        {Object.keys(statistics).length > 0 && (
          <MobileCard className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_notifications || 0}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{statistics.unread_notifications || 0}</p>
                <p className="text-sm text-gray-500">Unread</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{statistics.read_notifications || 0}</p>
                <p className="text-sm text-gray-500">Read</p>
              </div>
            </div>
          </MobileCard>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'unread'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Unread
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {activeTab === 'unread' ? 'Unread Notifications' : 'All Notifications'}
          </h3>
          {activeTab === 'all' && statistics.unread_notifications > 0 && (
            <MobileButton
              onClick={handleMarkAllAsRead}
              variant="secondary"
              size="sm"
            >
              Mark All Read
            </MobileButton>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.is_read ? 'ring-2 ring-blue-200' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <div className="mt-2">
                        <MobileButton
                          onClick={() => handleMarkAsRead(notification.id)}
                          variant="secondary"
                          size="sm"
                        >
                          Mark as Read
                        </MobileButton>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">
                {activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          )}
        </div>
      </div>
    </MobileModal>
  );
};

export default NotificationCenter;