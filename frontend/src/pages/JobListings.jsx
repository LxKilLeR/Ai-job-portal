import React, { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, DollarSign, Filter, Sparkles, Clock, Globe } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://ai-job-portal-backend-1.onrender.com').replace(/\/$/, '');

export default function JobListings() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/jobs`);
        setJobs(res.data.data || []);
        setError('');
      } catch (err) {
        console.error(err);
        setJobs([]);
        setError('DB se jobs load nahi ho paayin. Please retry.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const formatPostedAt = (dateValue) => {
    if (!dateValue) return 'Recently posted';
    const postedDate = new Date(dateValue);
    const diffHours = Math.floor((Date.now() - postedDate.getTime()) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const filteredJobs = jobs.filter(j => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) || 
                         j.skills.some(s => s.toLowerCase().includes(search.toLowerCase())) ||
                         j.company.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'All' || j.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-10">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
        <div className="glass-panel p-8 sticky top-32">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold font-syne text-xl text-white">Filters</h3>
            <Filter size={20} className="text-indigo-primary" />
          </div>
          
          <div className="space-y-8">
             <div className="space-y-4">
               <label className="label-text">Employment Type</label>
               <div className="space-y-2">
                 {['All', 'Full-time', 'Contract', 'Remote'].map(type => (
                   <button 
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      selectedType === type 
                      ? 'bg-indigo-primary text-white shadow-lg shadow-indigo-primary/20' 
                      : 'hover:bg-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                   >
                     {type}
                   </button>
                 ))}
               </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main List */}
      <div className="flex-1 space-y-8">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search roles, companies, or specific technologies..." 
            className="input-field pl-14 py-5 text-lg font-medium shadow-2xl transition-all hover:bg-white/10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-primary/20 border-t-indigo-primary rounded-full animate-spin"></div>
            <span className="text-gray-400 font-bold animate-pulse">Scanning the job market...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {error && (
              <div className="glass-panel border border-red-500/30 px-4 py-3 text-sm font-medium text-red-300">
                {error}
              </div>
            )}
            <AnimatePresence mode='popLayout'>
              {filteredJobs.map((job, idx) => (
                <Motion.div 
                  key={job._id || idx} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Link to={`/jobs/${job._id}`} className="glass-card flex flex-col md:flex-row gap-8 p-8 hover:border-indigo-primary/40 group relative overflow-hidden">
                    {/* Hover Glow Effect */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex-1 relative z-10">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-primary px-2 py-1 rounded bg-indigo-primary/10">
                              {job.company}
                            </span>
                            <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                              <Clock size={12} /> {formatPostedAt(job.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-2xl font-extrabold font-syne text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-500 group-hover:bg-clip-text transition-all duration-500">
                            {job.title}
                          </h3>
                        </div>

                        {job.match && (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 text-sm font-bold text-indigo-300 bg-indigo-primary/20 px-4 py-2 rounded-xl border border-indigo-primary/30 shadow-[0_0_20px_rgba(79,110,247,0.2)]">
                              <Sparkles size={16} className="text-amber-400" />
                              {job.match}% AI Match
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-6 text-sm font-bold text-gray-400 mb-8 mt-2">
                        <div className="flex items-center gap-2 group-hover:text-gray-200 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                            <MapPin size={14} className="text-red-400" />
                          </div>
                          {job.location}
                        </div>
                        <div className="flex items-center gap-2 group-hover:text-gray-200 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                            <DollarSign size={14} className="text-green-400" />
                          </div>
                          {job.salary}
                        </div>
                        <div className="flex items-center gap-2 group-hover:text-gray-200 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
                            <Globe size={14} className="text-blue-400" />
                          </div>
                          {job.type}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {job.skills.map(s => (
                          <span key={s} className="text-[11px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 group-hover:border-indigo-primary/30 transition-all">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </Motion.div>
              ))}
            </AnimatePresence>
            
            {filteredJobs.length === 0 && (
              <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 glass-panel rounded-3xl border border-dashed border-white/10">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search size={32} className="text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No matching jobs found</h3>
                <p className="text-gray-500 max-w-xs mx-auto">Try adjusting your search terms or filters to find more opportunities.</p>
              </Motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
