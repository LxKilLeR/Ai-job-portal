import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Users, Zap, Eye, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getApiBase, getStoredToken, safeParseJson } from '../../utils/apiHelpers';

const API_BASE = getApiBase();

function getAuthHeaders() {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

const StatCard = ({ icon: Icon, label, value, color, trend, trendValue, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass-card p-6 group hover:border-indigo-primary/30 transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
        trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-400/10 text-red-400'
      }`}>
        {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trendValue}
      </div>
    </div>
    <p className="text-3xl font-syne font-extrabold text-white mb-1">{value.toLocaleString()}</p>
    <p className="text-sm text-gray-400 font-medium">{label}</p>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F1629] border border-white/10 rounded-xl p-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-white font-bold">{payload[0].value} applications</p>
      </div>
    );
  }
  return null;
};

export default function RecruiterDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [overviewRes, analyticsRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE}/api/recruiter/overview`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/recruiter/analytics?period=30d`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/recruiter/jobs?status=active&limit=3`, { headers: getAuthHeaders() })
      ]);

      const overviewData = await safeParseJson(overviewRes);
      const analyticsConfig = await safeParseJson(analyticsRes);
      const jobsConfig = await safeParseJson(jobsRes);
      if (!overviewData || !analyticsConfig || !jobsConfig) {
        throw new Error('Server returned non-JSON response');
      }

      // Debug: log responses
      console.log('Overview response:', overviewRes.status, overviewData);
      console.log('Analytics response:', analyticsRes.status, analyticsConfig);
      console.log('Jobs response:', jobsRes.status, jobsConfig);

      if (overviewData.success && analyticsConfig.success && jobsConfig.success) {
        setData(overviewData.data);

        // Format applications by date for the chart
        const appsByDate = analyticsConfig.data.applicationsByDate;
        const chartData = Object.keys(appsByDate).map(date => ({
          date,
          applicants: appsByDate[date]
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        setAnalyticsData(chartData);
        setActiveJobs(jobsConfig.data);
      } else {
        const errors = [];
        if (!overviewData.success) errors.push(`Overview: ${overviewData.message || 'failed'}`);
        if (!analyticsConfig.success) errors.push(`Analytics: ${analyticsConfig.message || 'failed'}`);
        if (!jobsConfig.success) errors.push(`Jobs: ${jobsConfig.message || 'failed'}`);
        setError(`Failed to fetch some dashboard data: ${errors.join(', ')}`);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(`Could not connect to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-primary/20 border-t-indigo-primary rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center border-red-500/20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="bg-indigo-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-600 transition-all">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-syne font-extrabold text-white">Recruiter Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening with your jobs today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Total Jobs Posted" value={data.totalJobs} color="bg-indigo-primary" trend="up" trendValue="+" delay={0} />
        <StatCard icon={Users} label="Total Applicants" value={data.totalApplicants} color="bg-amber-500" trend="up" trendValue="+" delay={0.05} />
        <StatCard icon={Zap} label="Active Jobs" value={data.activeJobs} color="bg-emerald-500" trend="up" trendValue="+" delay={0.1} />
        <StatCard icon={Eye} label="Avg Match Score" value={data.avgMatchScore + '%'} color="bg-rose-500" trend="up" trendValue="+" delay={0.15} />
      </div>

      {/* Charts + Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Applications Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-syne font-bold text-white text-lg">Applications Over Time</h3>
              <p className="text-gray-400 text-sm">Last 30 days</p>
            </div>
          </div>
          {analyticsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="appGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="applicants" stroke="#4F6EF7" strokeWidth={2.5} fill="url(#appGradient)" dot={{ fill: '#4F6EF7', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#4F6EF7' }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] w-full flex items-center justify-center text-gray-500 border border-white/5 bg-white/5 rounded-xl">
              No applications in the last 30 days.
            </div>
          )}
        </motion.div>

        {/* Active Jobs Quick View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-6"
        >
          <h3 className="font-syne font-bold text-white text-lg mb-1">Active Jobs</h3>
          <p className="text-gray-400 text-sm mb-5">By recent posting</p>
          <div className="space-y-4">
            {activeJobs.length > 0 ? activeJobs.map(job => (
              <div key={job._id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={16} className="text-indigo-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-bold truncate">{job.title}</p>
                  <p className="text-gray-400 text-xs truncate">{job.location}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-sm">{job.applicationsCount}</p>
                  <p className="text-gray-500 text-xs">applicants</p>
                </div>
              </div>
            )) : (
              <div className="text-gray-500 text-sm text-center py-4">No active jobs found.</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Applicants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-syne font-bold text-white text-lg">Recent Applicants</h3>
            <p className="text-gray-400 text-sm">Latest applications across all jobs</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.recentApplications.length > 0 ? data.recentApplications.map((app, idx) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
              className="flex items-center gap-4 p-4 bg-white/3 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-primary/20 flex items-center justify-center text-indigo-300 font-bold flex-shrink-0">
                {app.applicant?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">{app.applicant?.name || 'Unknown'}</p>
                <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                  <span className="truncate">{app.applicant?.email}</span>
                  <span>•</span>
                  <span className="truncate">{app.job?.title}</span>
                </div>
              </div>
              <div className="text-center flex-shrink-0">
                <div className={`text-lg font-syne font-extrabold ${app.matchScore >= 90 ? 'text-emerald-400' : app.matchScore >= 80 ? 'text-amber-400' : 'text-gray-400'}`}>
                  {app.matchScore || 0}%
                </div>
                <p className="text-xs text-gray-500">match</p>
              </div>
              <div className="flex-shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                  app.status === 'shortlisted' ? 'bg-amber-400/10 text-amber-400' :
                  app.status === 'rejected' ? 'bg-red-400/10 text-red-400' :
                  app.status === 'accepted' ? 'bg-emerald-400/10 text-emerald-400' :
                  'bg-indigo-primary/10 text-indigo-primary'
                } capitalize`}>
                  {app.status}
                </span>
              </div>
            </motion.div>
          )) : (
            <div className="text-center text-gray-500 py-8">No recent applicants yet.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
