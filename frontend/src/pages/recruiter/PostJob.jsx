import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Loader2, CheckCircle2, Briefcase } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';
const SKILL_SUGGESTIONS = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Figma', 'SQL', 'GraphQL', 'Go', 'Kubernetes', 'MongoDB'];

export default function PostJob() {
  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    skills: [],
    description: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (s && !form.skills.includes(s)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, s] }));
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Job title is required';
    if (!form.company.trim()) e.company = 'Company name is required';
    if (!form.location.trim()) e.location = 'Location is required';
    if (!form.description.trim()) e.description = 'Job description is required';
    if (form.skills.length === 0) e.skills = 'Add at least one skill';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const userStr = localStorage.getItem('ai_jobs_user');
      const token = userStr ? JSON.parse(userStr).token : null;
      const salary = form.salaryMin && form.salaryMax
        ? `${form.salaryMin} - ${form.salaryMax}`
        : form.salaryMin || form.salaryMax || '';

      const response = await fetch(`${API_BASE}/recruiter/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: form.title,
          company: form.company,
          location: form.location,
          type: form.type,
          salary,
          skills: form.skills,
          description: form.description,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to post job');

      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setForm({ title: '', company: '', location: '', type: 'Full-time', salaryMin: '', salaryMax: '', skills: [], description: '' });
        setErrors({});
      }, 3000);
    } catch (error) {
      console.error('Failed to create job:', error);
      setLoading(false);
      setErrors({ submit: error.message || 'Failed to post job. Please try again.' });
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
      >
        <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <h2 className="text-2xl font-syne font-extrabold text-white">Job Posted Successfully!</h2>
        <p className="text-gray-400 text-center max-w-md">Your job listing is now live and visible to job seekers. Go to Manage Jobs to see it.</p>
      </motion.div>
    );
  }

  const inputClass = (field) =>
    `w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-primary/40 ${
      errors[field] ? 'border-red-400/50' : 'border-white/10 focus:border-indigo-primary/60'
    }`;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-syne font-extrabold text-white">Post a New Job</h1>
        <p className="text-gray-400 mt-1">Fill in the details below. Job seekers will see it immediately.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card p-8 space-y-6"
      >
        {/* Row 1: Title + Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-300 mb-2 block">Job Title *</label>
            <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior Frontend Developer" className={inputClass('title')} />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="text-sm font-bold text-gray-300 mb-2 block">Company Name *</label>
            <input name="company" value={form.company} onChange={handleChange} placeholder="e.g. TechNova" className={inputClass('company')} />
            {errors.company && <p className="text-red-400 text-xs mt-1">{errors.company}</p>}
          </div>
        </div>

        {/* Row 2: Location + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-bold text-gray-300 mb-2 block">Location *</label>
            <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Remote or San Francisco, CA" className={inputClass('location')} />
            {errors.location && <p className="text-red-400 text-xs mt-1">{errors.location}</p>}
          </div>
          <div>
            <label className="text-sm font-bold text-gray-300 mb-2 block">Employment Type</label>
            <select name="type" value={form.type} onChange={handleChange} className={inputClass('type')}>
              {['Full-time', 'Part-time', 'Contract', 'Remote', 'Internship', 'Hybrid'].map(t => (
                <option key={t} value={t} className="bg-[#0F1629]">{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="text-sm font-bold text-gray-300 mb-2 block">Salary Range</label>
          <div className="flex gap-3 items-center">
            <input name="salaryMin" value={form.salaryMin} onChange={handleChange} placeholder="Min (e.g. ₹8 LPA)" className={`flex-1 ${inputClass('salary')}`} />
            <span className="text-gray-500 font-bold">–</span>
            <input name="salaryMax" value={form.salaryMax} onChange={handleChange} placeholder="Max (e.g. ₹15 LPA)" className={`flex-1 ${inputClass('salary')}`} />
          </div>
        </div>

        {/* Skills Input */}
        <div>
          <label className="text-sm font-bold text-gray-300 mb-2 block">Required Skills *</label>
          <div className={`rounded-xl border p-3 min-h-[52px] ${errors.skills ? 'border-red-400/50' : 'border-white/10'} bg-white/5`}>
            <div className="flex flex-wrap gap-2">
              {form.skills.map(skill => (
                <span key={skill} className="flex items-center gap-1.5 bg-indigo-primary/15 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-indigo-primary/25">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addSkill(skillInput))}
                placeholder={form.skills.length === 0 ? 'Type a skill and press Enter...' : ''}
                className="bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none min-w-[120px] flex-1"
              />
            </div>
          </div>
          {errors.skills && <p className="text-red-400 text-xs mt-1">{errors.skills}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 8).map(s => (
              <button type="button" key={s} onClick={() => addSkill(s)}
                className="text-xs text-gray-500 hover:text-indigo-primary border border-white/5 hover:border-indigo-primary/30 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                <Plus size={10} />{s}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-bold text-gray-300 mb-2 block">Job Description *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={5}
            placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
            className={inputClass('description')}
          />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description}</p>}
          <p className="text-xs text-gray-500 mt-1">{form.description.length} characters</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-primary hover:bg-indigo-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2 shadow-lg shadow-indigo-primary/20"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" />Publishing job...</>
          ) : (
            <><Briefcase size={18} />Publish Job Listing</>
          )}
        </button>

        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3 rounded-lg text-sm">
            {errors.submit}
          </div>
        )}
      </motion.form>
    </div>
  );
}
