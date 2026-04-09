import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Bookmark, Eye, Target, Plus, Briefcase, Zap, Sparkles, TrendingUp } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getApiBase, getStoredToken, getStoredUser, safeParseJson } from '../utils/apiHelpers';

const API_BASE = getApiBase();

const getAuthHeaders = () => {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const [overviewStats, setOverviewStats] = useState({
    applicationsCount: 0,
    savedJobsCount: 0,
    profileViews: 0,
    matchScore: 0
  });
  const [topRecommendations, setTopRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);

  useEffect(() => {
    const fetchSeekerOverview = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/seeker-overview`, {
          headers: getAuthHeaders()
        });

        const data = await safeParseJson(res);
        if (!data) {
          throw new Error('Server returned non-JSON response');
        }
        if (data.success) {
          setOverviewStats({
            applicationsCount: data.data?.applicationsCount || 0,
            savedJobsCount: data.data?.savedJobsCount || 0,
            profileViews: data.data?.profileViews || 0,
            matchScore: data.data?.matchScore || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch seeker overview:', error);
      }
    };

    fetchSeekerOverview();
  }, []);

  useEffect(() => {
    const fetchTopRecommendations = async () => {
      try {
        setRecommendationsLoading(true);

        const parsedUser = getStoredUser();
        const userId = user?.id || user?._id || parsedUser?.id || parsedUser?._id;

        const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        const res = await fetch(`${API_BASE}/api/recommendations${query}`);
        const data = await safeParseJson(res);
        if (!data) {
          throw new Error('Server returned non-JSON response');
        }

        if (data.success) {
          const ranked = Array.isArray(data.data)
            ? [...data.data].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 2)
            : [];
          setTopRecommendations(ranked);
        } else {
          setTopRecommendations([]);
        }
      } catch (error) {
        console.error('Failed to fetch top recommendations:', error);
        setTopRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    fetchTopRecommendations();
  }, [user?.id, user?._id]);

  const stats = [
    { label: 'Applications', value: overviewStats.applicationsCount, icon: FileText, color: 'text-blue-400', trend: 'Live from your profile' },
    { label: 'Saved Jobs', value: overviewStats.savedJobsCount, icon: Bookmark, color: 'text-amber-400', trend: 'Live from your profile' },
    { label: 'Profile Views', value: overviewStats.profileViews, icon: Eye, color: 'text-green-400', trend: 'Live from your profile' },
    { label: 'Match Score', value: `${overviewStats.matchScore}%`, icon: Target, color: 'text-indigo-primary', trend: 'Average of your applications' }
  ];

  return (
    <div className="space-y-12">
      {/* Welcome Banner */}
      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group border-white/10"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-indigo-primary/15"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-400/5 rounded-full blur-[80px] -ml-20 -mb-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-primary to-amber-400 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-all"></div>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&h=160&fit=crop'}
              alt="Profile"
              className="w-32 h-32 rounded-3xl border-2 border-white/20 shadow-2xl relative z-10 object-cover"
            />
          </div>
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-primary/10 text-indigo-300 text-xs font-black uppercase tracking-widest rounded-lg mb-4">
              <Sparkles size={12} /> Active Candidate
            </div>
            <h1 className="text-4xl md:text-5xl font-syne font-extrabold mb-3 text-white">
              {user?.profileCompleted ? 'Welcome Back,' : 'Welcome,'} <span className="text-indigo-primary">{user?.name?.split(' ')[0]}!</span>
            </h1>
          </div>
        </div>
      </Motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((S, idx) => (
           <Motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass-card p-8 border-white/5 hover:border-white/20 transition-all group"
           >
             <div className={`w-14 h-14 rounded-2xl bg-white/5 ${S.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-all shadow-inner`}>
               <S.icon size={28} />
             </div>
             <div className="space-y-1">
               <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{S.label}</p>
               <h3 className="text-4xl font-syne font-extrabold text-white">{S.value}</h3>
               <p className="text-[10px] font-bold text-gray-500 pt-2 flex items-center gap-1 uppercase tracking-tighter">
                 <TrendingUp size={10} className={S.color} /> {S.trend}
               </p>
             </div>
           </Motion.div>
        ))}
      </div>

      {/* Main Grid: Recommended & Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        {/* Recommended Jobs */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-syne font-extrabold text-white flex items-center gap-3">
              <Zap className="text-amber-400" /> AI Recommendations
            </h2>
            <Link to="/recommendations" className="text-sm font-bold text-indigo-primary hover:text-white transition-colors">View All</Link>
          </div>

          <div className="space-y-4">
            {recommendationsLoading ? (
              <div className="glass-panel p-6 border-white/5 text-sm text-gray-400 font-medium">
                Loading best matches...
              </div>
            ) : topRecommendations.length === 0 ? (
              <div className="glass-panel p-6 border-white/5 text-sm text-gray-400 font-medium">
                No recommendations available yet. Complete your profile to improve matching.
              </div>
            ) : (
              topRecommendations.map((rec) => (
                <Link key={rec.id} to={`/jobs/${rec.id}`} className="block">
                  <div className="glass-panel p-6 border-white/5 hover:bg-white/5 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-indigo-primary transition-colors">
                          <Briefcase size={22} className="text-indigo-primary" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-white mb-1">{rec.title || 'Untitled Role'}</h4>
                          <p className="text-sm text-gray-400">{rec.company || 'Unknown Company'} • {rec.location || 'Location not specified'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-green-400 mb-1">{rec.matchScore || 0}% Match</div>
                        <div className="text-xs text-gray-500">{rec.salary || 'Salary not specified'}</div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-syne font-extrabold text-white">Quick Actions</h2>
          <div className="space-y-4">
            <Link to="/build-resume" className="block">
              <div className="glass-panel p-6 hover:bg-indigo-primary/10 border-white/5 hover:border-indigo-primary/30 transition-all group flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-primary/20 text-indigo-primary flex items-center justify-center group-hover:scale-110 transition-all">
                  <Plus size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Build AI Resume</h4>
                  <p className="text-xs text-gray-400">Neural optimization</p>
                </div>
              </div>
            </Link>

            <Link to="/jobs" className="block">
              <div className="glass-panel p-6 hover:bg-amber-400/10 border-white/5 hover:border-amber-400/30 transition-all group flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-all">
                  <Target size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white">Active Pursuit</h4>
                  <p className="text-xs text-gray-400">Search 10k+ roles</p>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </div>
    </div>
  );
}
