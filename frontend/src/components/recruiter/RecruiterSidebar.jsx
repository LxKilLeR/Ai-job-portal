import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Briefcase, PlusCircle, Users, BarChart2,
  LogOut, Zap, X, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/recruiter', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/recruiter/profile', icon: User, label: 'My Profile' },
  { path: '/recruiter/post-job', icon: PlusCircle, label: 'Post Job' },
  { path: '/recruiter/jobs', icon: Briefcase, label: 'Manage Jobs' },
  { path: '/recruiter/applicants', icon: Users, label: 'Applicants' },
  { path: '/recruiter/analytics', icon: BarChart2, label: 'Analytics' },
];

export default function RecruiterSidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-primary/30">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <span className="font-syne font-extrabold text-white text-lg">HireAI</span>
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-primary">Recruiter Hub</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 group ${
                isActive
                  ? 'bg-indigo-primary text-white shadow-lg shadow-indigo-primary/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-primary transition-colors'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-navy border-r border-white/5 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 h-full w-64 bg-navy border-r border-white/5 z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
