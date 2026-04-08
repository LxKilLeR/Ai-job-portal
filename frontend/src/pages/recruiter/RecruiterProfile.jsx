import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, MapPin, Briefcase, Camera, Edit3, Settings, LogOut, Link as LinkIcon, Globe, X, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

const getStoredToken = () => {
  try {
    const storedUser = localStorage.getItem('ai_jobs_user');
    const parsed = storedUser ? JSON.parse(storedUser) : null;
    return parsed?.token || localStorage.getItem('token') || '';
  } catch (error) {
    return localStorage.getItem('token') || '';
  }
};

export default function RecruiterProfile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    location: '',
    phone: '',
    bio: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [latestJobs, setLatestJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);

  const formatPostedAgo = (dateValue) => {
    if (!dateValue) return 'Posted recently';
    const createdAt = new Date(dateValue);
    const diffMs = Date.now() - createdAt.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    if (diffDays === 0) return 'Posted today';
    if (diffDays === 1) return 'Posted 1 day ago';
    return `Posted ${diffDays} days ago`;
  };

  // Fetch fresh user data from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      let cachedUser = null;
      try {
        const storedUser = localStorage.getItem('ai_jobs_user');
        cachedUser = storedUser ? JSON.parse(storedUser) : null;
      } catch (error) {
        cachedUser = null;
      }

      try {
        const token = getStoredToken();
        const res = await fetch(`${API_BASE}/api/recruiter/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          // Keep auth context and storage in sync with latest profile values.
          updateUser({
            id: data.data.id || data.data._id,
            name: data.data.name,
            email: data.data.email,
            role: data.data.role,
            company: data.data.company,
            location: data.data.location,
            phone: data.data.phone,
            bio: data.data.bio,
            avatar: data.data.avatar,
            token
          });
          
          setFormData({
            name: data.data.name || '',
            email: data.data.email || '',
            company: data.data.company || '',
            location: data.data.location || '',
            phone: data.data.phone || '',
            bio: data.data.bio || ''
          });
        } else {
          // Fallback to cached auth user if API fails
          setFormData({
            name: cachedUser?.name || '',
            email: cachedUser?.email || '',
            company: cachedUser?.company || '',
            location: cachedUser?.location || '',
            phone: cachedUser?.phone || '',
            bio: cachedUser?.bio || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Fallback to cached auth user
        setFormData({
          name: cachedUser?.name || '',
          email: cachedUser?.email || '',
          company: cachedUser?.company || '',
          location: cachedUser?.location || '',
          phone: cachedUser?.phone || '',
          bio: cachedUser?.bio || ''
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchLatestJobs = async () => {
      setJobsLoading(true);
      try {
        const token = getStoredToken();
        const res = await fetch(`${API_BASE}/api/recruiter/jobs?limit=2`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();
        if (data.success) {
          setLatestJobs(Array.isArray(data.data) ? data.data.slice(0, 2) : []);
        } else {
          setLatestJobs([]);
        }
      } catch (error) {
        console.error('Failed to fetch latest jobs:', error);
        setLatestJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchLatestJobs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getStoredToken();
      const res = await fetch(`${API_BASE}/api/recruiter/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        updateUser({
          id: data.data.id || data.data._id,
          name: data.data.name,
          email: data.data.email,
          role: data.data.role,
          company: data.data.company,
          location: data.data.location,
          phone: data.data.phone,
          bio: data.data.bio,
          avatar: data.data.avatar,
          token
        });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        // Update formData with server response
        setFormData({
          name: data.data.name,
          email: data.data.email,
          company: data.data.company,
          location: data.data.location,
          phone: data.data.phone,
          bio: data.data.bio
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const profileStats = [
    { label: 'Jobs Posted', value: '14', icon: Briefcase, color: 'text-blue-400' },
    { label: 'Active Candidates', value: '86', icon: User, color: 'text-indigo-400' },
    { label: 'Placement Rate', value: '92%', icon: Shield, color: 'text-green-400' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg font-bold">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Profile Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group border-white/10"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-primary/10 rounded-full blur-[100px] -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="relative group/avatar">
            <div className="absolute -inset-2 bg-gradient-to-r from-indigo-primary to-purple-500 rounded-full blur opacity-40 group-hover/avatar:opacity-75 transition-all duration-500"></div>
            <div className="w-40 h-40 rounded-full border-4 border-white/10 overflow-hidden relative z-10 shadow-2xl">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${formData.name || 'R'}&background=4F6EF7&color=fff&size=128`}
                alt={formData.name}
                className="w-full h-full object-cover transform group-hover/avatar:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white" size={32} />
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute bottom-2 right-2 p-2.5 bg-indigo-primary text-white rounded-xl shadow-lg border border-white/20 z-20 hover:scale-110 transition-transform"
              title="Edit Profile"
            >
              <Edit3 size={16} />
            </button>
          </div>

          <div className="text-center md:text-left space-y-4">
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-2">
              <span className="px-3 py-1 bg-indigo-primary/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-primary/30">
                Premium Recruiter
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/30">
                Verified
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-syne font-extrabold text-white tracking-tight leading-tight">
              {formData.name}
            </h1>
            <p className="text-xl text-gray-400 font-medium flex items-center justify-center md:justify-start gap-2">
              <Shield size={20} className="text-indigo-primary" /> Hiring Manager @ <span className="text-white font-bold italic underline decoration-indigo-primary/50">{formData.company || 'HireAI Corp'}</span>
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
              <div className="flex items-center gap-2 text-gray-500">
                <Mail size={16} />
                <span className="text-sm font-bold">{formData.email}</span>
              </div>
              {formData.location && (
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin size={16} />
                  <span className="text-sm font-bold">{formData.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats and Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8"
          >
            <h3 className="text-xl font-syne font-extrabold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-primary/20 flex items-center justify-center">
                <User size={18} className="text-indigo-primary" />
              </div>
              About
            </h3>
            <p className="text-gray-400 leading-relaxed font-medium">
              {formData.bio || 'No bio added yet. Click edit to add your professional background.'}
            </p>
          </motion.div>

          {/* Activity Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-8"
          >
            <h3 className="text-xl font-syne font-extrabold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Briefcase size={18} className="text-blue-400" />
              </div>
              Hiring Activity
            </h3>
            <div className="space-y-4">
              {jobsLoading ? (
                <p className="text-gray-400 text-sm font-medium">Loading latest jobs...</p>
              ) : latestJobs.length === 0 ? (
                <p className="text-gray-400 text-sm font-medium">No jobs posted yet.</p>
              ) : (
                latestJobs.map((job) => (
                  <div key={job._id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/10 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-primary/20 flex items-center justify-center">
                        <Shield size={20} className="text-indigo-primary" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{job.title || 'Untitled Job'}</h4>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-black">
                          {formatPostedAgo(job.createdAt)} • {job.applicationsCount || 0} Applicants
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:border-indigo-primary transition-all">
                      →
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-8 space-y-6"
          >
            {profileStats.map((S, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${S.color} group-hover:scale-110 transition-transform`}>
                  <S.icon size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">{S.label}</p>
                  <h4 className="text-2xl font-syne font-extrabold text-white">{S.value}</h4>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Socials & Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-8 space-y-6"
          >
            <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Connected Networks</h4>
            <div className="flex gap-4">
              {[LinkIcon, Globe].map((Icon, idx) => (
                <button key={idx} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-indigo-primary hover:border-indigo-primary/50 transition-all">
                  <Icon size={20} />
                </button>
              ))}
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full py-4 bg-indigo-primary/20 hover:bg-indigo-primary/30 border border-indigo-primary/30 rounded-2xl text-white font-bold flex items-center justify-center gap-3 transition-all"
              >
                <Edit3 size={18} /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-red-400 font-bold flex items-center justify-center gap-3 transition-all"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-navy border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-navy/95 backdrop-blur-md border-b border-white/5 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-syne font-extrabold text-white">Edit Profile</h2>
                  <p className="text-sm text-gray-400 mt-1">Update your professional information</p>
                </div>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={24} className="text-gray-400" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSave} className="p-8 space-y-6">
                {message.text && (
                  <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-primary focus:ring-1 focus:ring-indigo-primary transition-all"
                      placeholder="Enter your name"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-primary focus:ring-1 focus:ring-indigo-primary transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Company</label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-primary focus:ring-1 focus:ring-indigo-primary transition-all"
                      placeholder="Enter company name"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-primary focus:ring-1 focus:ring-indigo-primary transition-all"
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-primary focus:ring-1 focus:ring-indigo-primary transition-all"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Professional Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-primary focus:ring-1 focus:ring-indigo-primary transition-all resize-none"
                    placeholder="Tell us about your recruiting experience and expertise..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-8 py-3 rounded-xl bg-indigo-primary hover:bg-indigo-primary/90 text-white font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} /> Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
