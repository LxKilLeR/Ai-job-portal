import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sparkles, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AIRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const storedUser = localStorage.getItem('ai_jobs_user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        const userId = user?.id || user?._id || parsedUser?.id || parsedUser?._id;

        const res = await axios.get(`${API_BASE}/api/recommendations`, {
          params: userId ? { userId } : {}
        });
        setRecommendations(res.data.data || []);
        setError('');
      } catch (err) {
        console.error('Recommendations fetch failed:', err);
        setRecommendations([]);
        setError('Recommendations load nahi hui.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [user?.id, user?._id]);

  if(loading) return (
    <div className="flex flex-col items-center justify-center py-40 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-indigo-primary/20 border-t-indigo-primary rounded-full animate-spin"></div>
        <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-primary animate-pulse" size={24} />
      </div>
      <div className="text-center">
        <h3 className="text-2xl font-syne font-extrabold text-white mb-2">Analyzing Neural Patterns</h3>
        <p className="text-gray-400 font-medium">Our AI is scanning 10k+ roles to find your perfect match...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      {/* Header Section */}
      <Motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="text-center relative"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-primary/10 blur-[100px] rounded-full -z-10"></div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-primary/10 border border-indigo-primary/20 text-indigo-300 font-bold text-xs uppercase tracking-widest mb-6">
          <Sparkles size={14} className="text-amber-400" /> Career Intelligence Engine
        </div>
        <h1 className="text-5xl md:text-6xl font-syne font-extrabold mb-4 text-white tracking-tight">
          Your <span className="text-indigo-primary">Neural</span> Matches.
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto font-medium">
          We've analyzed your skills, experience, and aspirations to curate these high-probability opportunities.
        </p>
      </Motion.div>

      {/* Recommendations List */}
      <div className="space-y-8">
        <h2 className="text-2xl font-syne font-extrabold text-white px-4">Top Opportunities</h2>
        {error && (
          <div className="glass-panel border border-red-500/30 px-4 py-3 text-sm font-medium text-red-300">
            {error}
          </div>
        )}
        {!error && recommendations.length === 0 && (
          <div className="glass-panel px-6 py-10 text-center text-gray-400">
            No jobs matched your profile. Update your skills and experience to unlock personalized recommendations.
          </div>
        )}
        <AnimatePresence>
          {recommendations.map((rec, i) => (
            <Motion.div 
              key={rec.id} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: i * 0.15 }}
              className={`glass-panel p-0 overflow-hidden border-white/10 transition-all ${expanded === rec.id ? 'ring-2 ring-indigo-primary/40 shadow-2xl' : 'hover:border-white/20'}`}
            >
              <div 
                className="p-8 cursor-pointer flex flex-col md:flex-row justify-between items-center gap-6" 
                onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
              >
                <div className="flex items-center gap-6">
                  <div className="relative w-20 h-20 rounded-2xl bg-navy/50 flex items-center justify-center border-2 overflow-hidden group" style={{ borderColor: `rgba(79,110,247, ${rec.matchScore/100})` }}>
                    <div className="absolute inset-x-0 bottom-0 bg-indigo-primary/20 backdrop-blur-sm flex items-center justify-center py-1">
                       <span className="font-black text-[10px] text-white uppercase tracking-tighter">Match</span>
                    </div>
                    <span className="font-syne font-black text-2xl text-white">{rec.matchScore}%</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold font-syne text-white mb-1 group-hover:text-indigo-primary transition-colors">{rec.title}</h2>
                    <p className="text-gray-400 font-bold text-sm tracking-wide">{rec.company} • {rec.location}</p>
                    <p className="text-xs text-indigo-300 mt-2">{rec.matchedSkillsCount || 0}/{rec.totalSkillsCount || 0} skills matched</p>
                    <div className="flex gap-2 mt-3">
                      {rec.skills?.slice(0, 3).map(s => (
                        <span key={s} className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 text-gray-500 rounded border border-white/5">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <Link to={`/jobs/${rec.id}`} className="hidden md:flex btn-primary px-6 py-3 text-sm font-bold shadow-lg">
                      View Details
                   </Link>
                   <div className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                      {expanded === rec.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                   </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expanded === rec.id && (
                  <Motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-indigo-primary/5"
                  >
                    <div className="p-8 space-y-6">
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-indigo-primary/20 flex items-center justify-center text-indigo-primary shrink-0">
                          <Brain size={20} />
                        </div>
                        <div>
                          <h4 className="text-white font-extrabold font-syne mb-2 uppercase tracking-widest text-xs">AI Insight</h4>
                          <p className="text-gray-300 text-sm leading-relaxed font-medium">{rec.reason}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <Link to={`/jobs/${rec.id}`} className="md:hidden btn-primary w-full py-4 text-center font-bold">Apply Now</Link>
                        <button className="btn-ghost w-full sm:w-auto px-8 py-4 font-bold border-white/10">Save Match</button>
                      </div>
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>
            </Motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
