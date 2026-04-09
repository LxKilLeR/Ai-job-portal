import React, { useEffect, useRef, useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import html2pdf from 'html2pdf.js';
import { Download, LayoutTemplate, FileEdit, Sparkles, Wand2, Eye, Split, Trash2, Plus, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function ResumeBuilder() {
  const { user } = useAuth();
  const [data, setData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    github: '',
    role: '',
    summary: '',
    experience: '',
    projects: '',
    education: '',
    skills: '',
    certifications: '',
    achievements: '',
    languages: ''
  });

  const [profileLoading, setProfileLoading] = useState(true);

  const [template, setTemplate] = useState('modern');
  const [view, setView] = useState('split'); // 'split', 'editor', 'preview'
  const printRef = useRef();

  useEffect(() => {
    const loadProfileAndResume = async () => {
      const storedUserRaw = localStorage.getItem('ai_jobs_user');
      const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
      const token = user?.token || storedUser?.token || localStorage.getItem('token');
      const userId = user?.id || user?._id || storedUser?.id || storedUser?._id;

      if (storedUser) {
        setData((prev) => ({
          ...prev,
          name: storedUser.name || prev.name,
          email: storedUser.email || prev.email,
          phone: storedUser.phone || prev.phone,
          address: storedUser.address || storedUser.location || prev.address,
          role: storedUser.profession || prev.role,
          summary: storedUser.bio || prev.summary,
          skills: Array.isArray(storedUser.skills) ? storedUser.skills.join(', ') : prev.skills
        }));
      }

      if (!token) {
        setProfileLoading(false);
        return;
      }

      try {
        const profileRes = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          const profile = profileData?.data || {};

          setData((prev) => ({
            ...prev,
            name: profile.name || prev.name,
            email: profile.email || prev.email,
            phone: profile.phone || prev.phone,
            address: profile.address || profile.location || prev.address,
            role: profile.profession || prev.role,
            summary: profile.bio || prev.summary,
            skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : prev.skills
          }));
        }

        if (userId) {
          const resumeRes = await fetch(`${API_BASE}/api/resume/user/${userId}`);
          if (resumeRes.ok) {
            const resumeData = await resumeRes.json();
            const resume = resumeData?.data;
            if (resume) {
              setData((prev) => ({
                ...prev,
                skills: resume.extractedSkills?.length ? resume.extractedSkills.join(', ') : prev.skills,
                experience: resume.extractedExperience || prev.experience,
                education: resume.extractedEducation || prev.education,
                summary: resume.parsedData?.summary || prev.summary,
                projects: resume.parsedData?.projects || prev.projects
              }));
            }
          }
        }
      } catch (error) {
        console.error('Failed to load profile/resume data:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfileAndResume();
  }, [user?.id, user?._id, user?.token]);

  const handleDownload = () => {
    const el = printRef.current;
    if (!el) return;
    
    const opt = {
      margin: 0,
      filename: `Resume_${data.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 3, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(el).save();
  };

  const handleMagicFill = () => {
    // Simulate AI optimization
    setData(prev => ({
      ...prev,
      summary: "Dynamic and results-driven Senior AI Frontend Engineer with 8+ years of expertise in crafting high-impact digital experiences. Expert in React ecosystems and specializing in the seamless integration of Generative AI to drive user-centric innovation.",
      skills: prev.skills.includes('System Design') ? prev.skills : prev.skills + ', System Design, Prompt Engineering, Vector Databases',
      projects: prev.projects || "- AI Resume Analyzer (React, Node.js, Gemini API)\n- Job Matching Dashboard with skill scoring\n- Recruiter Panel with applicant tracking",
      certifications: prev.certifications || "AWS Cloud Practitioner\nMeta Front-End Developer Certificate",
      achievements: prev.achievements || "Improved user engagement by 45%\nReduced page load time by 38%",
      languages: prev.languages || "English, Hindi"
    }));
  };

  const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

  const nameParts = String(data.name || '').trim().split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const parsedSkills = String(data.skills || '').split(',').map((s) => s.trim()).filter(Boolean);
  const rawLanguages = String(data.languages || '').trim();
  const parsedLanguages = rawLanguages
    .split(/[,;\n|]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const hasLanguages = parsedLanguages.length > 0 || rawLanguages.length > 0;
  const languagesDisplay = parsedLanguages.length > 0 ? parsedLanguages.join(', ') : rawLanguages;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      {/* Action Header */}
      <div className="flex items-center justify-between mb-8 glass-panel p-4 px-8 border-white/10 rounded-2xl">
        <div className="flex items-center gap-4">
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              <button 
                onClick={() => setView('editor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'editor' ? 'bg-indigo-primary text-white shadow-lg shadow-indigo-primary/20' : 'text-gray-400 hover:text-white'}`}
              >
                <FileEdit size={14} /> Editor
              </button>
              <button 
                onClick={() => setView('split')}
                className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'split' ? 'bg-indigo-primary text-white shadow-lg shadow-indigo-primary/20' : 'text-gray-400 hover:text-white'}`}
              >
                <Split size={14} /> Split
              </button>
              <button 
                onClick={() => setView('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${view === 'preview' ? 'bg-indigo-primary text-white shadow-lg shadow-indigo-primary/20' : 'text-gray-400 hover:text-white'}`}
              >
                <Eye size={14} /> Preview
              </button>
           </div>
           
           <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
           
           <div className="flex gap-2">
              <button 
                onClick={() => setTemplate('modern')}
                className={`p-2 rounded-lg border transition-all ${template === 'modern' ? 'border-indigo-primary bg-indigo-primary/10 text-indigo-primary' : 'border-white/10 text-gray-400'}`}
                title="Modern Template"
              >
                <LayoutTemplate size={20} />
              </button>
              <button 
                onClick={() => setTemplate('classic')}
                className={`p-2 rounded-lg border transition-all ${template === 'classic' ? 'border-indigo-primary bg-indigo-primary/10 text-indigo-primary' : 'border-white/10 text-gray-400'}`}
                title="Classic Template"
              >
                <FileText size={20} />
              </button>
           </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleMagicFill}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-xl font-bold text-sm hover:bg-amber-400/20 transition-all group active:scale-95"
          >
            <Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> Magic AI Fill
          </button>
          <button 
            onClick={handleDownload}
            className="btn-primary px-6 py-2.5 text-sm font-bold shadow-[0_0_20px_rgba(79,110,247,0.3)]"
          >
            <Download size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0 overflow-hidden">
        {/* Editor Pane */}
        <AnimatePresence mode="wait">
          {(view === 'editor' || view === 'split') && (
            <Motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className={`${view === 'split' ? 'w-1/2' : 'w-full'} flex flex-col min-h-0`}
            >
              <div className="glass-panel p-8 overflow-y-auto custom-scrollbar flex-1 border-white/10">
                <h3 className="text-xl font-extrabold font-syne text-white mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-primary/20 flex items-center justify-center text-indigo-primary">
                    <FileEdit size={16} />
                  </div>
                  Structure Your Career
                </h3>

                {profileLoading && (
                  <div className="mb-6 text-xs font-semibold text-indigo-300 bg-indigo-primary/10 border border-indigo-primary/20 px-3 py-2 rounded-lg">
                    Loading your saved profile data...
                  </div>
                )}
                
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-text">Full Name</label>
                      <input name="name" value={data.name} onChange={handleChange} className="input-field" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="label-text">Title</label>
                      <input name="role" value={data.role} onChange={handleChange} className="input-field" placeholder="e.g. AI Specialist" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-text">Phone</label>
                      <input name="phone" value={data.phone} onChange={handleChange} className="input-field" placeholder="e.g. +91 98765 43210" />
                    </div>
                    <div className="space-y-2">
                      <label className="label-text">Address</label>
                      <input name="address" value={data.address} onChange={handleChange} className="input-field" placeholder="e.g. Delhi, India" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-text">LinkedIn</label>
                      <input name="linkedin" value={data.linkedin} onChange={handleChange} className="input-field" placeholder="linkedin.com/in/username" />
                    </div>
                    <div className="space-y-2">
                      <label className="label-text">GitHub</label>
                      <input name="github" value={data.github} onChange={handleChange} className="input-field" placeholder="github.com/username" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="label-text">Email Address</label>
                    <input name="email" value={data.email} onChange={handleChange} className="input-field" placeholder="johndoe@example.com" />
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <label className="label-text">Professional Summary</label>
                        <span className="text-[10px] font-black text-indigo-primary uppercase bg-indigo-primary/10 px-2 py-0.5 rounded">AI Optimized</span>
                     </div>
                    <textarea name="summary" value={data.summary} onChange={handleChange} className="input-field h-32 resize-none leading-relaxed" placeholder="Briefly describe your career..." />
                  </div>

                  <div className="space-y-2">
                    <label className="label-text">Work Experience</label>
                    <textarea name="experience" value={data.experience} onChange={handleChange} className="input-field h-56 resize-none font-mono text-sm" placeholder="Markdown supported..." />
                  </div>

                  <div className="space-y-2">
                    <label className="label-text">Education</label>
                    <textarea name="education" value={data.education} onChange={handleChange} className="input-field h-32 resize-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="label-text">Projects</label>
                    <textarea name="projects" value={data.projects} onChange={handleChange} className="input-field h-40 resize-none" placeholder="One project per line" />
                  </div>

                  <div className="space-y-2">
                    <label className="label-text">Skills (Comma separated)</label>
                    <input name="skills" value={data.skills} onChange={handleChange} className="input-field" placeholder="React, Node.js, etc." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-text">Certifications</label>
                      <textarea name="certifications" value={data.certifications} onChange={handleChange} className="input-field h-28 resize-none" placeholder="One per line" />
                    </div>
                    <div className="space-y-2">
                      <label className="label-text">Achievements</label>
                      <textarea name="achievements" value={data.achievements} onChange={handleChange} className="input-field h-28 resize-none" placeholder="One per line" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="label-text">Languages (Comma separated)</label>
                    <input name="languages" value={data.languages} onChange={handleChange} className="input-field" placeholder="English, Hindi" />
                  </div>
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Preview Pane */}
        <AnimatePresence mode="wait">
          {(view === 'preview' || view === 'split') && (
            <Motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`${view === 'split' ? 'w-1/2' : 'w-full'} flex flex-col bg-navy/20 rounded-3xl overflow-hidden border border-white/5 relative group`}
            >
              {/* Zoom Controls Overlay */}
              <div className="absolute bottom-6 right-6 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button className="w-10 h-10 rounded-full bg-white text-navy flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-bold">+</button>
                 <button className="w-10 h-10 rounded-full bg-white text-navy flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-bold">-</button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 bg-[#020617]/50 flex justify-center custom-scrollbar">
                {/* Paper Representation */}
                <div 
                  ref={printRef} 
                  className={`bg-white text-slate-900 shadow-2xl origin-top transition-all duration-500 scale-[0.8] md:scale-100 ${template === 'modern' ? 'flex' : ''}`} 
                  style={{ width: '820px', minHeight: '1050px', position: 'relative' }}
                >
                  {template === 'classic' ? (
                    <div className="w-full p-16 font-serif">
                       <header className="text-center border-b-2 border-slate-900 pb-4 mb-8">
                         <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">{data.name}</h1>
                         <p className="text-md font-bold uppercase tracking-widest text-slate-600">{data.role}</p>
                         <p className="text-sm text-slate-600 mt-2">{data.email} {data.phone ? `• ${data.phone}` : ''} {data.address ? `• ${data.address}` : ''}</p>
                         {(data.linkedin || data.github) && (
                           <p className="text-sm text-slate-600 mt-1">{data.linkedin} {data.github ? `• ${data.github}` : ''}</p>
                         )}
                       </header>
                       
                       <section className="mb-8">
                         <h2 className="text-lg font-black uppercase border-b-2 border-slate-200 mb-3 tracking-widest text-indigo-900">Summary</h2>
                         <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>
                       </section>
                       
                       <section className="mb-8">
                         <h2 className="text-lg font-black uppercase border-b-2 border-slate-200 mb-3 tracking-widest text-indigo-900">Professional Experience</h2>
                         <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{data.experience}</pre>
                       </section>

                       <section className="mb-8">
                         <h2 className="text-lg font-black uppercase border-b-2 border-slate-200 mb-3 tracking-widest text-indigo-900">Education</h2>
                         <p className="text-sm leading-relaxed text-slate-700 italic">{data.education}</p>
                       </section>

                       <section className="mb-8">
                         <h2 className="text-lg font-black uppercase border-b-2 border-slate-200 mb-3 tracking-widest text-indigo-900">Projects</h2>
                         <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{data.projects}</pre>
                       </section>
                       
                       <section>
                         <h2 className="text-lg font-black uppercase border-b-2 border-slate-200 mb-3 tracking-widest text-indigo-900">Core Expertise</h2>
                         <div className="flex flex-wrap gap-2 pt-1 font-sans">
                           {parsedSkills.map(s => (
                             <span key={s} className="px-3 py-1 bg-slate-100 text-[10px] font-black uppercase rounded border border-slate-200">{s.trim()}</span>
                           ))}
                         </div>
                       </section>

                       <section className="mt-8 space-y-6">
                         <div className="min-w-0">
                           <h2 className="text-base font-outfit font-extrabold uppercase border-b-2 border-slate-200 mb-3 tracking-[0.08em] text-indigo-900 break-words leading-tight">Certifications</h2>
                           <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{data.certifications}</pre>
                         </div>
                         <div className="min-w-0">
                           <h2 className="text-base font-outfit font-extrabold uppercase border-b-2 border-slate-200 mb-3 tracking-[0.08em] text-indigo-900 break-words leading-tight">Achievements</h2>
                           <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{data.achievements}</pre>
                         </div>
                         {hasLanguages && (
                           <div className="min-w-0">
                             <h2 className="text-base font-outfit font-extrabold uppercase border-b-2 border-slate-200 mb-3 tracking-[0.08em] text-indigo-900 break-words leading-tight">Languages</h2>
                             <p className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{languagesDisplay}</p>
                           </div>
                         )}
                       </section>
                    </div>
                  ) : (
                    // Modern Neural Template 
                    <div className="flex w-full font-sans">
                       <aside className="w-[35%] bg-[#0f172a] text-white p-12">
                          <div className="w-16 h-1 w-full bg-indigo-500 mb-8 rounded-full"></div>
                          <h1 className="text-4xl font-black mb-3 leading-none italic">{firstName || 'Your'}<br/>{lastName || 'Name'}</h1>
                          <p className="text-indigo-400 font-bold uppercase text-[10px] tracking-widest mb-12">{data.role}</p>
                          
                          <div className="space-y-10">
                            <div>
                              <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4">Contact</h3>
                              <p className="text-sm font-medium opacity-80 break-all">{data.email}</p>
                            </div>
                            
                            <div>
                               <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4">Core Stack</h3>
                               <div className="flex flex-wrap gap-2">
                                 {parsedSkills.map(s => (
                                   <span key={s} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[9px] font-bold block">{s.trim()}</span>
                                 ))}
                               </div>
                            </div>

                            {hasLanguages && (
                              <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4">Languages</h3>
                                <div className="flex flex-wrap gap-2">
                                  {parsedLanguages.length > 0 ? parsedLanguages.map((lang) => (
                                    <span key={lang} className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[9px] font-bold block">{lang}</span>
                                  )) : (
                                    <span className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[9px] font-bold block">{languagesDisplay}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                       </aside>

                       <main className="flex-1 p-16 bg-white relative">
                          <header className="mb-12">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3">Professional Narrative</h3>
                             <p className="text-lg font-medium text-slate-800 leading-snug border-l-4 border-indigo-500 pl-6 italic">"{data.summary}"</p>
                          </header>
                          
                          <section className="mb-12">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 border-b border-slate-100 pb-2">Selected Trajectory</h3>
                             <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-slate-600 font-medium">{data.experience}</pre>
                          </section>

                          <section className="mb-12">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 border-b border-slate-100 pb-2">Projects</h3>
                             <pre className="text-sm font-sans whitespace-pre-wrap leading-relaxed text-slate-600 font-medium">{data.projects}</pre>
                          </section>
                          
                          <section>
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 border-b border-slate-100 pb-2">Academic Foundation</h3>
                             <p className="text-sm font-bold text-slate-800 whitespace-pre-wrap leading-relaxed">{data.education}</p>
                          </section>

                          {(data.certifications || data.achievements || hasLanguages) && (
                            <section className="mt-12 space-y-6">
                              {!!data.certifications && (
                                <div className="min-w-0">
                                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-indigo-500 mb-4 border-b border-slate-100 pb-2 break-words leading-tight">Certifications</h3>
                                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{data.certifications}</pre>
                                </div>
                              )}
                              {!!data.achievements && (
                                <div className="min-w-0">
                                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-indigo-500 mb-4 border-b border-slate-100 pb-2 break-words leading-tight">Achievements</h3>
                                  <pre className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{data.achievements}</pre>
                                </div>
                              )}
                              {hasLanguages && (
                                <div className="min-w-0">
                                  <h3 className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-indigo-500 mb-4 border-b border-slate-100 pb-2 break-words leading-tight">Languages</h3>
                                  <p className="text-xs font-sans whitespace-pre-wrap leading-relaxed text-slate-700">{languagesDisplay}</p>
                                </div>
                              )}
                            </section>
                          )}

                          {/* Neural Badge watermark */}
                          <div className="absolute bottom-8 right-8 flex items-center gap-2 opacity-5 scale-150 rotate-[-15deg]">
                             <Sparkles size={40} className="text-indigo-800" />
                             <span className="font-black text-2xl uppercase tracking-tighter text-indigo-800 italic">HireAI Intelligence</span>
                          </div>
                       </main>
                    </div>
                  )}
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
