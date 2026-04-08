import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, UserPlus, Shield, ArrowRight, CheckCircle } from 'lucide-react';
import { requestOTP, verifyOTP } from '../services/otpService';
import { GoogleLogin } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Signup() {
  const [searchParams] = useSearchParams();
  const urlRole = searchParams.get('role');

  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    company: ''
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const { setAuth, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Set role from URL param on mount
  useEffect(() => {
    if (urlRole && ['Seeker', 'Employer'].includes(urlRole)) {
      setFormData(prev => ({ ...prev, role: urlRole }));
    }
  }, [urlRole]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.role) {
      return setError('Please select Job Seeker or Recruiter role first.');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    setLoading(true);
    try {
      const res = await requestOTP(formData);
      if (res.success) {
        setStep(2);
        setDevOtp(res.dev_otp || '');
        setError('');
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('OTP request failed:', err);
      setError('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignupSuccess = async (credentialResponse) => {
    setError('');
    if (!formData.role) {
      setError('Please select Job Seeker or Recruiter role first.');
      return;
    }

    const res = await loginWithGoogle(credentialResponse.credential, formData.role);
    if (res.success) {
      const role = res.user?.role;
      const needsSetup = role === 'Seeker' && !res.user?.profileCompleted;
      navigate(role === 'Employer' ? '/recruiter' : needsSetup ? '/profile-setup' : '/dashboard');
    } else {
      setError(res.message || 'Google signup failed');
    }
  };

  const handleGoogleSignupError = () => {
    setError('Google sign-in failed. Please try again.');
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length !== 6) {
      return setError('Please enter a valid 6-digit OTP');
    }

    setLoading(true);
    try {
      const res = await verifyOTP({
        email: formData.email,
        otp,
        role: formData.role,
        company: formData.company,
        name: formData.name,
        password: formData.password
      });

      if (res.success) {
        // Use setAuth to store token and user
        setAuth(res.token, res.user);

        // Redirect based on role
        const needsSetup = res.user.role === 'Seeker' && !res.user.profileCompleted;
        navigate(res.user.role === 'Employer' ? '/recruiter' : needsSetup ? '/profile-setup' : '/dashboard');
      } else {
        setError(res.message || 'Verification failed');
      }
    } catch (err) {
      console.error('OTP verify failed:', err);
      setError('Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await requestOTP(formData);
      if (res.success) {
        setDevOtp(res.dev_otp || '');
        setOtp('');
        setError('');
      } else {
        setError(res.message || 'Failed to resend OTP');
      }
    } catch {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass-panel w-full max-w-md p-8 rounded-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            {step === 1 ? 'Create Account' : 'Verify Email'}
          </h2>
          <p className="text-gray-400">
            {step === 1
              ? 'Join the AI-powered hiring revolution'
              : `Enter the 6-digit code sent to ${formData.email}`
            }
          </p>
        </div>

        {error && (
          <div className="bg-danger/20 border border-danger/50 text-red-200 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            {/* Role Selection */}
            <div className="flex gap-3 mb-4">
              <label className={`flex-1 text-center py-3 rounded-xl cursor-pointer transition-all border font-bold text-sm ${
                formData.role === 'Seeker'
                  ? 'bg-indigo-primary/20 border-indigo-primary text-white'
                  : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="Seeker"
                  checked={formData.role === 'Seeker'}
                  onChange={handleChange}
                  className="hidden"
                />
                🔍 Job Seeker
              </label>
              <label className={`flex-1 text-center py-3 rounded-xl cursor-pointer transition-all border font-bold text-sm ${
                formData.role === 'Employer'
                  ? 'bg-indigo-primary/20 border-indigo-primary text-white'
                  : 'border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="Employer"
                  checked={formData.role === 'Employer'}
                  onChange={handleChange}
                  className="hidden"
                />
                💼 Recruiter
              </label>
            </div>

            {/* Full Name */}
            <div>
              <label className="label-text">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  name="name"
                  required
                  className="input-field pl-10"
                  placeholder="Alex Johnson"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Company (only for recruiter/employer) */}
            {formData.role === 'Employer' && (
              <div>
                <label className="label-text">Company Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input
                    name="company"
                    required
                    className="input-field pl-10"
                    placeholder="TechNova Inc."
                    value={formData.company}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="label-text">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="email"
                  name="email"
                  required
                  className="input-field pl-10"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="label-text">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  className="input-field pl-10"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  Request OTP <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[var(--glass-bg)] text-gray-500 uppercase tracking-widest">or</span>
              </div>
            </div>

            {!formData.role ? (
              <button
                type="button"
                disabled
                className="w-full py-3 rounded-xl border border-white/10 text-gray-500 bg-white/5 cursor-not-allowed"
              >
                Select role to continue with Google
              </button>
            ) : !GOOGLE_CLIENT_ID ? (
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center text-xs font-semibold text-amber-200">
                Google sign-up is not configured for this deployment.
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSignupSuccess}
                  onError={handleGoogleSignupError}
                  text="signup_with"
                  shape="rectangular"
                  theme="filled_blue"
                  size="large"
                  width="300"
                />
              </div>
            )}
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {/* OTP Input */}
            <div>
              <label className="label-text">Enter 6-digit OTP</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="input-field pl-10 text-center text-2xl tracking-[0.5em] font-mono"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
            </div>

            {/* Resend */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-sm text-indigo-primary hover:text-indigo-400 font-medium"
              >
                {loading ? 'Sending...' : "Didn't receive code? Resend"}
              </button>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : (
                <>
                  <Shield size={18} /> Verify & Create Account
                </>
              )}
            </button>

            {/* Back button */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-center text-gray-400 hover:text-white text-sm mt-2"
            >
              ← Back to form
            </button>

            {/* Dev OTP display */}
            {devOtp && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  Dev Mode - OTP
                </p>
                <p className="text-amber-300 text-2xl font-mono font-bold tracking-widest">
                  {devOtp}
                </p>
              </div>
            )}
          </form>
        )}

        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account? <Link to="/login" className="text-indigo-primary hover:text-white font-bold">Log in</Link>
        </p>
      </div>
    </div>
  );
}
