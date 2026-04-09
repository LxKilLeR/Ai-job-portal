import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, CheckCircle, XCircle, Star, Briefcase, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { getApiBase, getStoredToken, safeParseJson } from '../../utils/apiHelpers';

const API_BASE = getApiBase();

function getAuthHeaders() {
  const token = getStoredToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

const MatchRing = ({ value }) => {
  const score = value || 0;
  const color = score >= 90 ? '#10B981' : score >= 80 ? '#F59E0B' : '#6B7280';
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
        <circle
          cx="28" cy="28" r="22"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 138.2} 138.2`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold text-white">{score}%</span>
    </div>
  );
};

const statusColors = {
  pending: 'bg-indigo-primary/10 text-indigo-400',
  shortlisted: 'bg-amber-400/10 text-amber-400',
  rejected: 'bg-red-400/10 text-red-400',
  accepted: 'bg-emerald-400/10 text-emerald-400',
};

export default function Applicants() {
  const [applicants, setApplicants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('All');
  const [expanded, setExpanded] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both jobs (for the filter) and applications
      const [jobsRes, appsRes] = await Promise.all([
        fetch(`${API_BASE}/api/recruiter/jobs?limit=50`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/recruiter/applications?limit=100`, { headers: getAuthHeaders() })
      ]);

      const jobsData = await safeParseJson(jobsRes);
      const appsData = await safeParseJson(appsRes);

      if (!jobsData || !appsData) {
        throw new Error('Server returned non-JSON response');
      }

      if (jobsRes.ok && appsRes.ok) {
        setJobs(jobsData.data);
        setApplicants(appsData.data);
      } else {
        setError(appsData.message || 'Failed to load data');
      }
    } catch (err) {
      setError('Could not connect to the backend server.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/recruiter/applications/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await safeParseJson(res);
      if (!data) {
        throw new Error('Server returned non-JSON response');
      }
      if (res.ok) {
        setApplicants(prev => prev.map(a => a._id === id ? { ...a, status: data.data.status } : a));
        fetchData();
      } else {
        setError(data.message || 'Failed to update applicant status');
      }
    } catch (err) {
      console.error('Failed to update status', err);
      setError('Could not update applicant status. Please try again.');
    }
  };

  const filtered = applicants.filter(a => {
    const jobMatch = selectedJob === 'All' || a.job?._id === selectedJob;
    const statusMatch = filterStatus === 'All' || a.status === filterStatus.toLowerCase();
    return jobMatch && statusMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-syne font-extrabold text-white">Applicants</h1>
          <p className="text-gray-400 mt-1">{applicants.length} total applicants · AI-ranked by match score</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedJob}
          onChange={e => setSelectedJob(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-primary/60"
        >
          <option value="All" className="bg-[#0F1629]">All Jobs</option>
          {jobs.map(j => (
            <option key={j._id} value={j._id} className="bg-[#0F1629]">{j.title}</option>
          ))}
        </select>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', 'Pending', 'Shortlisted', 'Accepted', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filterStatus === s ? 'bg-indigo-primary text-white' : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-primary/20 border-t-indigo-primary rounded-full animate-spin"></div>
          <p className="text-gray-400 font-bold animate-pulse">Loading applicants...</p>
        </div>
      )}

      {error && !loading && (
        <div className="glass-card p-8 text-center border border-red-500/20">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={fetchData} className="bg-indigo-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-600 transition-all">Retry</button>
        </div>
      )}

      {/* Applicant Cards */}
      {!loading && !error && (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).map((applicant, idx) => {
              const isExpanded = expanded === applicant._id;
              const isAccepted = applicant.status === 'accepted';
              return (
                <motion.div
                  key={applicant._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-primary/20 flex flex-shrink-0 items-center justify-center font-bold text-indigo-300 text-xl">
                        {applicant.applicant?.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <h3 className="font-syne font-bold text-white">{applicant.applicant?.name || 'Unknown User'}</h3>
                            <p className="text-gray-500 text-xs">{applicant.applicant?.email}</p>
                            <p className="text-indigo-400 text-xs font-semibold mt-0.5">Applied for: {applicant.job?.title || 'Unknown Job'}</p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${statusColors[applicant.status] || 'bg-gray-400/10 text-gray-400'}`}>
                            {applicant.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(applicant.applicant?.skills || []).slice(0, 5).map(s => (
                            <span key={s} className="text-xs bg-white/5 text-gray-300 px-2 py-0.5 rounded-md border border-white/5">{s}</span>
                          ))}
                        </div>
                      </div>
                      <MatchRing value={applicant.matchScore} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 flex-wrap">
                      <button
                        onClick={() => updateStatus(applicant._id, 'accepted')}
                        disabled={isAccepted}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isAccepted
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 cursor-not-allowed'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20'
                        }`}
                      >
                        <CheckCircle size={14} /> {isAccepted ? 'Accepted' : 'Accept'}
                      </button>
                      <button
                        onClick={() => updateStatus(applicant._id, 'shortlisted')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 text-xs font-bold transition-all border border-amber-400/20"
                      >
                        <Star size={14} /> Shortlist
                      </button>
                      <button
                        onClick={() => updateStatus(applicant._id, 'rejected')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-400/10 text-red-400 hover:bg-red-400/20 text-xs font-bold transition-all border border-red-400/20"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : applicant._id)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-primary/20 text-indigo-400 hover:bg-indigo-primary/10 text-xs font-bold transition-all"
                      >
                        <Briefcase size={14} />
                        View Notes
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    {/* Expandable Notes Section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-indigo-primary/10 space-y-4">
                            <div className="bg-indigo-primary/5 border border-indigo-primary/15 rounded-xl p-4">
                              <p className="text-gray-300 text-sm leading-relaxed">
                                {applicant.notes || "No additional notes provided for this applicant yet."}
                              </p>
                              {applicant.resume && (
                                <a href={applicant.resume} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs hover:underline mt-2 inline-block">
                                  View Resume
                                </a>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="glass-card p-12 text-center">
              <p className="text-gray-400">No applicants match your filters yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
