import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, MapPin, DollarSign, Calendar, Send } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'https://ai-job-portal-backend-1.onrender.com').replace(/\/$/, '');

export default function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/jobs/${id}`);
        setJob(res.data.data);
      } catch (err) {
        console.error(err);
        // Fallback
        setJob({ id: 1, title: 'Senior Frontend Developer', company: 'TechNova', location: 'San Francisco, CA', type: 'Full-time', salary: '$120k - $150k', skills: ['React', 'TypeScript', 'Tailwind'], remote: true, match: 92, postedAt: '2 days ago', description: 'We are looking for a highly skilled professional to join our team... You will lead the frontend architecture and collaborate with design systems.' });
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading details...</div>;
  if (!job) return <div className="text-center py-20 text-red-400">Job not found</div>;

  const handleApply = async () => {
    setApplyMessage({ type: '', text: '' });
    setIsApplying(true);

    try {
      const storedUser = localStorage.getItem('ai_jobs_user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const token = parsedUser?.token || localStorage.getItem('token');

      if (!token) {
        setApplyMessage({ type: 'error', text: 'Please login first to apply for this job.' });
        return;
      }

      if (parsedUser?.role && parsedUser.role !== 'Seeker') {
        setApplyMessage({ type: 'error', text: 'Only job seekers can apply. Please login with a seeker account.' });
        return;
      }

      const res = await fetch(`${API_BASE}/api/jobs/${id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        data = { success: false, message: 'Server returned an invalid response.' };
      }

      if (res.ok && data.success) {
        setApplyMessage({ type: 'success', text: 'Application submitted successfully.' });
      } else {
        setApplyMessage({ type: 'error', text: data.message || 'Failed to submit application.' });
      }
    } catch (error) {
      setApplyMessage({ type: 'error', text: 'Failed to submit application. Please try again.' });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}>
      <Link to="/jobs" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={18} /> Back to Jobs
      </Link>
      
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-syne mb-2">{job.title}</h1>
            <div className="text-xl text-indigo-300 font-medium">{job.company}</div>
            {applyMessage.text && (
              <p className={`mt-3 text-sm font-semibold ${applyMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {applyMessage.text}
              </p>
            )}
          </div>
          <button onClick={handleApply} disabled={isApplying} className="btn-primary disabled:opacity-60">
            <Send size={18} /> {isApplying ? 'Applying...' : 'Apply Now'}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-card p-4 flex items-center gap-3">
             <div className="p-2 bg-white/5 rounded-lg"><MapPin size={20} className="text-gray-400"/></div>
             <div><p className="text-xs text-gray-400">Location</p><p className="font-medium">{job.location}</p></div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
             <div className="p-2 bg-white/5 rounded-lg"><DollarSign size={20} className="text-green-400"/></div>
             <div><p className="text-xs text-gray-400">Salary</p><p className="font-medium">{job.salary}</p></div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
             <div className="p-2 bg-white/5 rounded-lg"><Building size={20} className="text-indigo-400"/></div>
             <div><p className="text-xs text-gray-400">Type</p><p className="font-medium">{job.type}</p></div>
          </div>
          <div className="glass-card p-4 flex items-center gap-3">
             <div className="p-2 bg-white/5 rounded-lg"><Calendar size={20} className="text-amber-400"/></div>
             <div><p className="text-xs text-gray-400">Posted</p><p className="font-medium">{job.postedAt}</p></div>
          </div>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-3 font-syne border-b border-white/10 pb-2">About the Role</h2>
            <p className="text-gray-300 leading-relaxed">{job.description}</p>
          </section>
          <section>
            <h2 className="text-xl font-bold mb-3 font-syne border-b border-white/10 pb-2">Required Skills</h2>
            <div className="flex gap-2 flex-wrap">
              {job.skills.map(s => <span key={s} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm">{s}</span>)}
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
