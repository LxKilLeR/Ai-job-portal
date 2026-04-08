import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function ProfileSetup() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const initialSkills = Array.isArray(user?.skills)
    ? user.skills
    : String(user?.skills || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

  const suggestedSkills = ['TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'Figma', 'SQL', 'GraphQL'];

  const [formData, setFormData] = useState({
    searchingFor: user?.searchingFor || '',
    profession: user?.profession || '',
    address: user?.address || ''
  });
  const [selectedSkills, setSelectedSkills] = useState(initialSkills);
  const [customSkill, setCustomSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setError('');
  };

  const addSkill = (skillValue) => {
    const nextSkill = String(skillValue || '').trim();
    if (!nextSkill) return;

    const exists = selectedSkills.some((item) => item.toLowerCase() === nextSkill.toLowerCase());
    if (exists) return;

    setSelectedSkills((prev) => [...prev, nextSkill]);
    setCustomSkill('');
    setError('');
  };

  const removeSkill = (skillValue) => {
    setSelectedSkills((prev) => prev.filter((item) => item !== skillValue));
  };

  const handleCustomSkillKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill(customSkill);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.searchingFor || !formData.profession || !selectedSkills.length || !formData.address) {
      setError('Please fill all fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile-setup`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          searchingFor: formData.searchingFor,
          profession: formData.profession,
          skills: selectedSkills,
          address: formData.address
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Failed to save profile setup');
        return;
      }

      updateUser({
        searchingFor: data.data.searchingFor,
        profession: data.data.profession,
        skills: data.data.skills,
        address: data.data.address,
        profileCompleted: true
      });

      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      console.error('Profile setup submit error:', requestError);
      setError('Failed to save profile setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10">
        <h1 className="text-3xl font-syne font-extrabold text-white mb-2">Complete Your Profile</h1>
        <p className="text-gray-400 mb-8">Help us show better jobs by filling these details.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label-text">Searching For</label>
            <input
              name="searchingFor"
              className="input-field"
              placeholder="e.g. Full-time remote role"
              value={formData.searchingFor}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label-text">You Are (Role)</label>
            <input
              name="profession"
              className="input-field"
              placeholder="e.g. Backend Developer, Frontend Developer"
              value={formData.profession}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="label-text">Skills</label>
            <div className="input-field min-h-[88px] py-3 px-3 flex flex-wrap gap-2 items-start">
              {selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-2 bg-indigo-primary/20 text-indigo-200 border border-indigo-primary/40 rounded-xl px-3 py-1.5 text-sm font-semibold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-indigo-100/80 hover:text-white leading-none"
                    aria-label={`Remove ${skill}`}
                  >
                    x
                  </button>
                </span>
              ))}

              <input
                value={customSkill}
                onChange={(event) => setCustomSkill(event.target.value)}
                onKeyDown={handleCustomSkillKeyDown}
                className="bg-transparent outline-none text-white text-sm min-w-[160px] flex-1"
                placeholder={selectedSkills.length ? 'Add more skill...' : 'Type skill and press Enter'}
              />
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {suggestedSkills
                .filter((skill) => !selectedSkills.some((item) => item.toLowerCase() === skill.toLowerCase()))
                .map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:border-indigo-primary/40 hover:bg-white/5 text-sm font-medium transition-all"
                  >
                    + {skill}
                  </button>
                ))}
            </div>
          </div>

          <div>
            <label className="label-text">Address</label>
            <input
              name="address"
              className="input-field"
              placeholder="e.g. Delhi, India"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 disabled:opacity-70">
            {loading ? 'Saving...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
