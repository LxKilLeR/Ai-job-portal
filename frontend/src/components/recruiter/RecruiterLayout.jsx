import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Outlet, Navigate } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import RecruiterSidebar from './RecruiterSidebar';
import { getNotifications } from '../../services/recruiterService';

export default function RecruiterLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading } = useAuth();
  const notificationsRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      setNotificationsError('');
      const response = await getNotifications({ limit: 12 });
      const items = response?.data || [];
      const seenStorageKey = `recruiter_notifications_seen_at_${user?.id || 'default'}`;
      const storedSeenAt = localStorage.getItem(seenStorageKey);
      const lastSeenAt = storedSeenAt ? new Date(storedSeenAt).getTime() : 0;
      const unreadCountFromItems = items.filter((item) => {
        const createdAt = new Date(item?.createdAt || item?.appliedAt || 0).getTime();
        return createdAt > lastSeenAt;
      }).length;
      setNotifications(items);
      setUnreadCount(unreadCountFromItems);
    } catch (error) {
      console.error('Load recruiter notifications error:', error);
      setNotificationsError('Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user || !['Employer', 'Recruiter'].includes(user.role)) return;

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, loadNotifications]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return 'Just now';

    const now = new Date();
    const createdAt = new Date(timestamp);
    const diffMs = now - createdAt;

    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return createdAt.toLocaleDateString();
  };

  const handleNotificationToggle = async () => {
    const nextOpenState = !notificationsOpen;
    setNotificationsOpen(nextOpenState);
    if (nextOpenState) {
      const seenStorageKey = `recruiter_notifications_seen_at_${user?.id || 'default'}`;
      localStorage.setItem(seenStorageKey, new Date().toISOString());
      setUnreadCount(0);
      if (notifications.length === 0 && !notificationsLoading) {
        await loadNotifications();
      }
    }
  };

  // Redirect if not a recruiter (support both 'Employer' and legacy 'Recruiter')
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white">Loading...</div>;
  }

  if (!user || !['Employer', 'Recruiter'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-[#0A0E1A] overflow-hidden">
      <RecruiterSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex-shrink-0 h-16 bg-navy/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 lg:px-8 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search jobs, candidates..."
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-primary/60 w-64 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={handleNotificationToggle}
                className="relative p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Open notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-indigo-primary text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-[22rem] max-w-[90vw] bg-[#121827] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Notifications</p>
                    <button
                      type="button"
                      onClick={loadNotifications}
                      className="text-xs text-indigo-primary hover:text-indigo-300 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading && (
                      <p className="px-4 py-6 text-sm text-gray-400">Loading notifications...</p>
                    )}

                    {!notificationsLoading && notificationsError && (
                      <p className="px-4 py-6 text-sm text-rose-400">{notificationsError}</p>
                    )}

                    {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                      <p className="px-4 py-6 text-sm text-gray-400">No notifications yet.</p>
                    )}

                    {!notificationsLoading && !notificationsError && notifications.map((notification) => (
                      <Link
                        key={notification.id}
                        to="/recruiter/applicants"
                        className="block px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                        onClick={() => setNotificationsOpen(false)}
                      >
                        <p className="text-sm font-medium text-white">{notification.title}</p>
                        <p className="text-xs text-gray-300 mt-1">{notification.message}</p>
                        <p className="text-[11px] text-gray-500 mt-2">{formatNotificationTime(notification.createdAt)}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Link 
              to="/recruiter/profile" 
              className="flex items-center gap-3 pl-3 border-l border-white/10 group/profile cursor-pointer hover:opacity-80 transition-all"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white group-hover/profile:text-indigo-primary transition-colors">{user?.name || 'Recruiter'}</p>
                <p className="text-xs text-indigo-primary font-semibold opacity-70">Recruiter</p>
              </div>
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-primary/40 group-hover/profile:border-indigo-primary group-hover/profile:scale-105 flex-shrink-0 transition-all duration-300 ring-2 ring-transparent group-hover/profile:ring-indigo-primary/20">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'R'}&background=4F6EF7&color=fff`}
                  alt={user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
