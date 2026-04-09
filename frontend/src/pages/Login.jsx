import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion as Motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password);
    console.log('Login response:', res);
    if (res.success) {
      const role = res.user?.role || res.role;
      console.log('User role:', role);
      const isRecruiter = ['Employer', 'Recruiter'].includes(role);
      const needsSetup = role === 'Seeker' && !res.user?.profileCompleted;
      navigate(isRecruiter ? '/recruiter' : needsSetup ? '/profile-setup' : '/dashboard');
    } else setError(res.message);
  };

  return (
    <div className="flex items-center justify-center min-h-[85vh] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-indigo-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-amber-400/10 rounded-full blur-[100px] animate-pulse delay-700"></div>

      <Motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-[480px] p-10 md:p-12 rounded-[2.5rem] relative z-10 border-white/10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <Motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-indigo-primary/20 text-indigo-primary mb-6 border-2 border-indigo-primary/30 shadow-inner"
          >
            <ShieldCheck size={40} />
          </Motion.div>
          <h2 className="text-4xl font-syne font-extrabold text-white mb-3 tracking-tight">Access <span className="text-indigo-primary">Portal</span></h2>
          <p className="text-gray-400 font-medium">Continue your AI-powered career evolution</p>
        </div>

        {error && (
          <Motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-8 text-sm font-bold flex items-center gap-3"
          >
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            {error}
          </Motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="label-text flex items-center gap-2">
               <Mail size={14} className="text-indigo-primary" /> Email Address
            </label>
            <div className="relative group">
              <input 
                type="email" 
                required 
                className="input-field pl-5 group-hover:border-indigo-primary/50 focus:border-indigo-primary transition-all" 
                placeholder="commander@hireai.io" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
               <label className="label-text flex items-center gap-2">
                  <Lock size={14} className="text-indigo-primary" /> Password
               </label>
               <a href="#" className="text-[10px] uppercase font-black tracking-widest text-gray-500 hover:text-indigo-primary transition-colors">Forgot Access?</a>
            </div>
            <div className="relative group">
              <input 
                type="password" 
                required 
                className="input-field pl-5 group-hover:border-indigo-primary/50 focus:border-indigo-primary transition-all" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
            </div>
          </div>
          
          <button type="submit" className="btn-primary w-full py-4 text-sm font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-indigo-primary/20 flex items-center justify-center gap-3 active:scale-95 group transition-all">
            Initiate Link <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-6 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
          <p className="text-center text-gray-400 text-sm font-medium">
            New to the network? <Link to="/signup" className="text-indigo-primary hover:text-white font-bold underline underline-offset-4 decoration-2">Create Digital Identity</Link>
          </p>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-500">
             <Zap size={10} className="text-amber-400" /> Neural encryption active
          </div>
        </div>
      </Motion.div>
    </div>
  );
}
