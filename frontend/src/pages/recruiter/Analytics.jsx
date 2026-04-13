import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { RefreshCw, Loader2 } from 'lucide-react';
import { getApiBase } from '../../utils/apiHelpers';

const API_BASE = getApiBase();

function getAuthHeaders() {
  const userStr = localStorage.getItem('ai_jobs_user');
  const token = userStr ? JSON.parse(userStr).token : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F1629] border border-white/10 rounded-xl p-3 shadow-xl text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        <p className="text-white font-bold">{payload[0].value} {payload[0].name === 'applicants' ? 'applications' : payload[0].name === 'value' ? '' : payload[0].name}</p>
      </div>
    );
  }
  return null;
};

const StatBox = ({ label, value, sub, color }) => (
  <div className={`glass-card p-5 border-l-4 ${color}`}>
    <p className="text-2xl font-syne font-extrabold text-white">{value}</p>
    <p className="text-sm font-bold text-gray-300 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [activeJobsCount, setActiveJobsCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsRes, jobsRes] = await Promise.all([
        fetch(`${API_BASE}/api/recruiter/analytics?period=${period.replace('d', '')}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/recruiter/jobs?status=active`, { headers: getAuthHeaders() })
      ]);

      const analyticsJson = await analyticsRes.json();
      const jobsJson = await jobsRes.json();

      if (analyticsJson.success) {
        setData(analyticsJson.data);
      } else {
        setError(analyticsJson.message || 'Failed to load analytics');
      }

      if (jobsJson.success) {
        setActiveJobsCount(jobsJson.data?.length || 0);
      }
    } catch (err) {
      setError('Could not connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-primary/20 border-t-indigo-primary rounded-full animate-spin"></div>
        <p className="text-gray-400 font-bold animate-pulse">Computing analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-12 text-center border-red-500/20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={fetchData} className="bg-indigo-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-600 transition-all">Retry</button>
      </div>
    );
  }

  // Format data for charts
  const appsByDate = data.applicationsByDate || {};
  const areaChartData = Object.keys(appsByDate).map(date => ({
    date,
    applicants: appsByDate[date]
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  const pieChartData = [
    { name: 'Pending', value: data.statusCounts?.pending || 0, color: '#4F6EF7' },
    { name: 'Shortlisted', value: data.statusCounts?.shortlisted || 0, color: '#fbbf24' },
    { name: 'Accepted', value: data.statusCounts?.accepted || 0, color: '#34d399' },
    { name: 'Rejected', value: data.statusCounts?.rejected || 0, color: '#f87171' },
  ].filter(item => item.value > 0);
  
  if (pieChartData.length === 0) pieChartData.push({ name: 'No Data', value: 1, color: '#374151' });

  const barChartData = (data.jobStats || []).map(stat => ({
    name: stat.title?.length > 15 ? stat.title.substring(0, 15) + '...' : stat.title,
    applicants: stat.count
  }));

  const avgPerJob = (data.jobStats?.length || 0) > 0 
    ? Math.round(data.totalApplications / data.jobStats.length) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-extrabold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Performance overview for your job listings</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-primary/60 outline-none"
          >
            <option value="7d" className="bg-[#0F1629]">Last 7 days</option>
            <option value="30d" className="bg-[#0F1629]">Last 30 days</option>
            <option value="90d" className="bg-[#0F1629]">Last 90 days</option>
          </select>
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Applications" value={data.totalApplications} sub={`Past ${period.replace('d','')} days`} color="border-indigo-primary" />
        <StatBox label="Avg. Applications" value={avgPerJob} sub="Per listing" color="border-amber-400" />
        <StatBox label="Active Jobs" value={activeJobsCount} sub="Currently live" color="border-emerald-400" />
        <StatBox label="Success Rate" value={`${data.successRate}%`} sub="Shortlisted/Accepted" color="border-rose-400" />
      </div>

      {/* Row 1: Area chart + Pie chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <h3 className="font-syne font-bold text-white mb-1">Applications Over Time</h3>
          <p className="text-gray-400 text-sm mb-6">Application volume trends</p>
          {areaChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="applicants" stroke="#4F6EF7" strokeWidth={2.5} fill="url(#grad1)" dot={{ fill: '#4F6EF7', r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] w-full flex items-center justify-center text-gray-500 bg-white/5 border border-white/5 rounded-xl">
              No applications data available.
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-6"
        >
          <h3 className="font-syne font-bold text-white mb-1">Applicant Status</h3>
          <p className="text-gray-400 text-sm mb-4">Current pipeline breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {pieChartData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>{value}</span>}
              />
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 2: Bar chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h3 className="font-syne font-bold text-white mb-1">Most Popular Jobs</h3>
        <p className="text-gray-400 text-sm mb-6">Total applicants per listing</p>
        {barChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barChartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="applicants" fill="#4F6EF7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] w-full flex items-center justify-center text-gray-500 bg-white/5 border border-white/5 rounded-xl">
            No jobs posted or no applications yet.
          </div>
        )}
      </motion.div>
    </div>
  );
}
