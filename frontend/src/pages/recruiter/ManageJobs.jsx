import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2, Pause, Play, MapPin, DollarSign, Users, ChevronDown, ChevronUp, X, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const userStr = localStorage.getItem('ai_jobs_user');
  const token = userStr ? JSON.parse(userStr).token : null;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [expandedJob, setExpandedJob] = useState(null);
  const [editJob, setEditJob] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug: Check auth token
      const userStr = localStorage.getItem('ai_jobs_user');
      const user = userStr ? JSON.parse(userStr) : null;
      console.log('🔍 Auth user data:', user);

      if (!user || !user.token) {
        setError('Not authenticated. Please login again.');
        setLoading(false);
        return;
      }

      const headers = getAuthHeaders();
      console.log('🔍 Request headers:', headers);

      const res = await fetch(`${API_BASE}/api/recruiter/jobs?limit=100`, { headers });
      console.log('🔍 Jobs API response status:', res.status, res.statusText);

      const data = await res.json();
      console.log('🔍 Jobs API response data:', data);

      if (data.success) {
        console.log('✅ Fetched jobs count:', data.data.length);
        console.log('📋 Jobs data:', data.data);
        const transformed = data.data.map(job => ({
          ...job,
          status: job.isActive !== false ? 'Active' : 'Paused',
          applicants: job.applicationsCount || 0,
          salary: job.salary || '',
          skills: job.skills || [],
        }));
        setJobs(transformed);

        if (data.data.length === 0) {
          console.log('⚠️ No jobs found. Either no jobs posted yet or userId mismatch.');
        }
      } else {
        setError(data.message || 'Failed to load jobs');
        console.error('❌ Jobs fetch failed:', data);
      }
    } catch (err) {
      setError('Could not connect to server. Is the backend running?');
      console.error('❌ Jobs fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/jobs/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j =>
          j._id === id ? { ...j, status: j.status === 'Active' ? 'Paused' : 'Active' } : j
        ));
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const deleteJob = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.filter(j => j._id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const saveEdit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/jobs/${editJob._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editJob.title,
          company: editJob.company,
          location: editJob.location,
          salary: editJob.salary,
          description: editJob.description,
        })
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j =>
          j._id === editJob._id
            ? { ...data.data, status: data.data.isActive !== false ? 'Active' : 'Paused', applicants: data.data.applicationsCount || 0 }
            : j
        ));
        setEditJob(null);
      }
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const filtered = jobs
    .filter(j => filterStatus === 'All' || j.status === filterStatus)
    .filter(j =>
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-extrabold text-white">Manage Jobs</h1>
          <p className="text-gray-400 mt-1">{jobs.length} total · {jobs.filter(j => j.status === 'Active').length} active</p>
        </div>
        <button onClick={fetchJobs} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search jobs..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-primary/60"
        />
        <div className="flex gap-2">
          {['All', 'Active', 'Paused'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                filterStatus === s ? 'bg-indigo-primary text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-primary/20 border-t-indigo-primary rounded-full animate-spin"></div>
          <span className="text-gray-400 font-bold animate-pulse">Loading your jobs...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass-card p-8 text-center border border-red-500/20">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchJobs} className="bg-indigo-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-600 transition-all">Retry</button>
        </div>
      )}

      {/* Jobs List */}
      {!loading && !error && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((job, idx) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: idx * 0.04 }}
                className="glass-card overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-syne font-bold text-white text-lg">{job.title}</h3>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
                          job.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5"><MapPin size={13} />{job.location}</span>
                        {job.salary && <span className="flex items-center gap-1.5"><DollarSign size={13} />{job.salary}</span>}
                        <span className="flex items-center gap-1.5">
                          <Users size={13} />
                          <span className="font-bold text-white">{job.applicants}</span> applicants
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {job.skills.map(s => (
                          <span key={s} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">{s}</span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleStatus(job._id)}
                        title={job.status === 'Active' ? 'Pause job' : 'Activate job'}
                        className={`p-2.5 rounded-xl border transition-all ${
                          job.status === 'Active'
                            ? 'border-amber-500/20 text-amber-400 hover:bg-amber-500/10'
                            : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {job.status === 'Active' ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => setEditJob({ ...job })}
                        className="p-2.5 rounded-xl border border-indigo-primary/20 text-indigo-400 hover:bg-indigo-primary/10 transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(job._id)}
                        className="p-2.5 rounded-xl border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => setExpandedJob(expandedJob === job._id ? null : job._id)}
                        className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                      >
                        {expandedJob === job._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedJob === job._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-white/5">
                          <p className="text-gray-300 text-sm leading-relaxed">{job.description}</p>
                          <p className="text-gray-500 text-xs mt-3">
                            Posted: {new Date(job.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-gray-400 text-lg mb-2">No jobs yet!</p>
              <p className="text-gray-500 text-sm">Post a job using "Post Job" to see it here.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-8 max-w-sm w-full text-center"
            >
              <div className="w-14 h-14 bg-red-400/10 border border-red-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} className="text-red-400" />
              </div>
              <h3 className="text-white font-syne font-bold text-xl mb-2">Delete Job?</h3>
              <p className="text-gray-400 text-sm mb-6">This cannot be undone. All applicants for this job will also be removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all">Cancel</button>
                <button onClick={() => deleteJob(deleteConfirm)} className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-syne font-bold text-white text-xl">Edit Job</h3>
                <button onClick={() => setEditJob(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              {[
                ['title', 'Job Title'],
                ['company', 'Company'],
                ['location', 'Location'],
                ['salary', 'Salary Range']
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">{label}</label>
                  <input
                    value={editJob[field] || ''}
                    onChange={e => setEditJob(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-primary/60"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  value={editJob.description || ''}
                  onChange={e => setEditJob(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-primary/60 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditJob(null)} className="flex-1 py-3 rounded-xl border border-white/10 text-gray-400 text-sm font-bold hover:text-white transition-all">Cancel</button>
                <button onClick={saveEdit} className="flex-1 py-3 rounded-xl bg-indigo-primary text-white text-sm font-bold hover:bg-indigo-600 transition-all">Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
