import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Briefcase, LogOut } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://ai-job-portal-backend-1.onrender.com').replace(/\/$/, '');

const parseJsonResponse = async (res) => {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const authToken = user?.token || localStorage.getItem('token');

  const fetchNotifications = useCallback(async () => {
    if (!authToken || user?.role !== 'Seeker') return;

    try {
      setLoadingNotifications(true);
      const res = await fetch(`${API_BASE}/api/notifications?limit=10`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      });

      const data = await parseJsonResponse(res);
      if (!data) {
        console.error('Notifications API returned non-JSON response');
        return;
      }

      if (res.ok && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data?.meta?.unreadCount || 0);
      } else {
        console.error('Notifications API failed:', data?.message || res.statusText);
      }
    } catch (error) {
      console.error('Failed to load seeker notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [authToken, user?.role]);

  const markAllRead = useCallback(async () => {
    if (!authToken) return;
    try {
      await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        }
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }, [authToken]);

  useEffect(() => {
    if (!user || user.role !== 'Seeker') return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBellClick = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) {
      // Optimistically clear badge as soon as user opens the notification panel.
      setUnreadCount(0);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));

      await markAllRead();
      await fetchNotifications();
    }
  };

  const handleNotificationClick = (item) => {
    setNotificationsOpen(false);
    const relatedJobId = item?.relatedJob?._id;
    if (relatedJobId) {
      navigate(`/jobs/${relatedJobId}`);
      return;
    }
    navigate('/dashboard');
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMins = Math.floor((now - then) / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-x-0 border-t-0 rounded-none px-8 py-5 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-2xl font-syne font-extrabold text-white">
        <div className="w-10 h-10 rounded-xl bg-indigo-primary flex items-center justify-center shadow-[0_0_20px_rgba(79,110,247,0.3)]">
          <Briefcase size={22} className="text-white" />
        </div>
        HireAI
      </Link>

      <div className="flex flex-1 justify-center gap-10 text-sm font-semibold text-gray-400 hidden md:flex">
        <Link to="/jobs" className="hover:text-indigo-primary transition-all duration-300 relative group">
          Find Jobs
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-primary transition-all group-hover:w-full"></span>
        </Link>
        <Link to="/recommendations" className="hover:text-indigo-primary transition-all duration-300 relative group">
          AI Matches
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-primary transition-all group-hover:w-full"></span>
        </Link>
        <Link to="/build-resume" className="hover:text-indigo-primary transition-all duration-300 relative group">
          Resume Builder
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-primary transition-all group-hover:w-full"></span>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            {user.role === 'Seeker' && (
              <div className="relative" ref={notificationRef}>
                <button
                  type="button"
                  onClick={handleBellClick}
                  className="relative p-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  aria-label="Open notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-indigo-primary text-[10px] leading-4 font-bold text-white text-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 max-w-[90vw] bg-[#10172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <button
                        type="button"
                        onClick={fetchNotifications}
                        className="text-xs text-indigo-300 hover:text-white transition-colors"
                      >
                        Refresh
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifications && (
                        <p className="px-4 py-5 text-sm text-gray-400">Loading...</p>
                      )}

                      {!loadingNotifications && notifications.length === 0 && (
                        <p className="px-4 py-5 text-sm text-gray-400">No notifications yet.</p>
                      )}

                      {!loadingNotifications && notifications.map((item) => (
                        <button
                          type="button"
                          key={item._id}
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${item.isRead ? 'bg-transparent' : 'bg-indigo-primary/5'}`}
                        >
                          <p className="text-sm font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-gray-300 mt-1">{item.message}</p>
                          <p className="text-[11px] text-gray-500 mt-2">{formatRelativeTime(item.createdAt)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <img src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop'} alt="avatar" className="w-10 h-10 rounded-full border-2 border-white/10 group-hover:border-indigo-primary transition-all" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-navy rounded-full"></div>
              </div>
              <span className="hidden md:inline font-bold text-gray-200 group-hover:text-white transition-colors">{user.name}</span>
            </Link>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all">
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-ghost px-5 py-2.5 text-sm font-bold">Login</Link>
            <Link to="/signup?role=Seeker" className="btn-primary px-6 py-2.5 text-sm font-bold">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
