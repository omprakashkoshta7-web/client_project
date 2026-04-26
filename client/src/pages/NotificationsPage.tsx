import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import notificationService, { Notification } from '../services/notification.service';

type TabType = 'all' | 'orders' | 'rewards' | 'system' | 'support' | 'account' | 'promotions';

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ page, limit: 20 });
      const notificationsData = response.data?.notifications || response.data || [];
      const meta = response.data?.meta;
      
      setNotifications(prev => page === 1 ? notificationsData : [...prev, ...notificationsData]);
      setHasMore(meta ? meta.page < meta.totalPages : notificationsData.length === 20);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      // Fallback to local update
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
      // Fallback to local update
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
          <p className="text-gray-600">You need to be logged in to view notifications</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Category icon mapping
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, { icon: JSX.Element; bg: string }> = {
      orders: {
        icon: <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
        bg: '#dbeafe'
      },
      rewards: {
        icon: <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        bg: '#fef3c7'
      },
      system: {
        icon: <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        bg: '#f3f4f6'
      },
      support: {
        icon: <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        bg: '#d1fae5'
      },
      account: {
        icon: <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
        bg: '#e9d5ff'
      },
      promotions: {
        icon: <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
        bg: '#fee2e2'
      }
    };
    return iconMap[category] || iconMap.system;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'orders', label: 'Orders' },
    { key: 'rewards', label: 'Rewards' },
    { key: 'system', label: 'System' },
    { key: 'support', label: 'Support' },
  ];

  const filtered = activeTab === 'all' ? notifications : notifications.filter(n => n.category === activeTab);
  const hasUnread = notifications.some(n => !n.isRead);

  return (
    <div style={{ backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 px-1">
          <h1 className="font-bold text-gray-900" style={{ fontSize: '26px' }}>Notifications</h1>
          {hasUnread && (
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-70 transition" 
              style={{ color: '#374151' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5 px-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap"
              style={{
                backgroundColor: activeTab === tab.key ? '#111111' : '#ffffff',
                color: activeTab === tab.key ? '#ffffff' : '#374151',
                border: activeTab === tab.key ? 'none' : '1px solid #e5e7eb',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            filtered.map(n => {
              const categoryStyle = getCategoryIcon(n.category);
              return (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                  className="flex items-start gap-4 px-6 py-5 rounded-2xl cursor-pointer hover:shadow-md transition"
                  style={{
                    backgroundColor: !n.isRead ? '#f3f4f6' : '#ffffff',
                    border: '1px solid #f3f4f6',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: categoryStyle.bg }}
                  >
                    {categoryStyle.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-gray-900" style={{ fontSize: '14px' }}>{n.title}</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatTime(n.createdAt)}</span>
                        {!n.isRead && (
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#111111' }} />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 leading-relaxed" style={{ fontSize: '13px', color: '#6b7280' }}>{n.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More */}
        {hasMore && !loading && filtered.length > 0 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setPage(p => p + 1)}
              className="px-6 py-2 rounded-full text-sm font-semibold transition"
              style={{ backgroundColor: '#ffffff', color: '#374151', border: '1px solid #e5e7eb' }}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
