import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Briefcase, Search, Building2, Users, Zap, Shield, Target } from 'lucide-react';

export default function Home() {
  const roles = [
    {
      id: 'seeker',
      icon: <Search className="text-indigo-primary" />,
      title: 'Job Seeker',
      desc: 'Find your dream job with AI-powered matching, build an intelligent resume, and get career recommendations.',
      features: [
        '🤖 AI job matching based on your skills',
        '📄 Auto-generated tailored resumes',
        '🎯 Career path recommendations',
        '💬 Chat with AI career coach'
      ],
      color: 'from-indigo-500 to-purple-600',
      link: '/signup?role=Seeker',
      cta: 'Find Jobs'
    },
    {
      id: 'recruiter',
      icon: <Building2 className="text-emerald-400" />,
      title: 'Recruiter / Employer',
      desc: 'Post jobs, manage applicants, and use AI to find the best candidates for your open positions.',
      features: [
        '📝 Post and manage job listings',
        '👥 View and filter applicants with match scores',
        '📊 Analytics dashboard with insights',
        '🤖 AI-powered candidate matching'
      ],
      color: 'from-emerald-500 to-teal-600',
      link: '/signup?role=Employer',
      cta: 'Post Jobs'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center py-20 px-4 relative"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-primary/10 blur-[120px] rounded-full -z-10 animate-pulse"></div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-primary/10 border border-indigo-primary/20 text-indigo-300 font-bold text-sm mb-8">
          <Sparkles size={16} className="text-amber-400" /> AI-Powered Career Platform
        </div>

        <h1 className="text-5xl md:text-7xl font-syne font-extrabold mb-6 tracking-tighter leading-tight bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent">
          Choose Your <br/><span className="text-indigo-primary">Path</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
          Are you looking for your next opportunity or searching for top talent? Select your role to get started.
        </p>
      </motion.div>

      {/* Role Selection Cards */}
      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
          {roles.map((role, idx) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2, duration: 0.6 }}
              className="glass-card overflow-hidden group hover:border-indigo-primary/40 transition-all duration-300"
            >
              {/* Card Header with gradient */}
              <div className={`h-32 bg-gradient-to-r ${role.color} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center shadow-2xl">
                    {React.cloneElement(role.icon, { size: 40 })}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8 -mt-12 relative">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-syne font-extrabold text-white mb-3">{role.title}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{role.desc}</p>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {role.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-lg">{feature.split(' ')[0]}</span>
                      <span className="text-gray-300">{feature.split(' ').slice(1).join(' ')}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  to={role.link}
                  className={`block w-full py-4 rounded-xl bg-gradient-to-r ${role.color} text-white font-bold text-center transition-all hover:scale-[1.02] active:scale-100 shadow-lg hover:shadow-xl`}
                >
                  {role.cta} <ArrowRight size={18} className="inline ml-2" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="border-t border-white/5 bg-navy/30 py-8"
      >
        <div className="flex flex-wrap justify-center items-center gap-8 px-4">
          <div className="text-center">
            <div className="text-2xl font-syne font-extrabold text-white">50k+</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-syne font-extrabold text-white">10k+</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">Jobs Posted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-syne font-extrabold text-white">98%</div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">AI Accuracy</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
