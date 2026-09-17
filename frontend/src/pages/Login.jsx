import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import { Sprout, Lock, Mail, ArrowRight, UserCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { DUMMY_USERS } from '../utils/dummyData';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if it's admin login or standard login
      let res;
      if (email.toLowerCase() === 'vivek24307@gmail.com') {
        res = await api.post('/admin/login', { email, password });
      } else {
        res = await api.post('/auth/login', { email, password });
      }

      if (res && res.data && res.data.token) {
        login(res.data.token, res.data.user);
        navigate('/');
        return;
      }
    } catch (err) {
      // Fallback for offline or serverless frontend if using demo credentials
      if (password === 'password123') {
        const matched = DUMMY_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (matched) {
          login('demo-jwt-token-' + Date.now(), matched);
          navigate('/');
          return;
        }
      }
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLoading(true);
    setError('');

    try {
      let res;
      if (demoEmail === 'vivek24307@gmail.com') {
        res = await api.post('/admin/login', { email: demoEmail, password: demoPassword });
      } else {
        res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      }
      if (res && res.data && res.data.token) {
        login(res.data.token, res.data.user);
        navigate('/');
        return;
      }
    } catch (err) {
      console.warn('[AUTH] Live API login unreachable, using offline demo session:', err.message);
    }

    // Seamless offline fallback for deployed environments
    const matchedUser = DUMMY_USERS.find(
      (u) => u.email.toLowerCase() === demoEmail.toLowerCase()
    ) || (demoEmail === 'vivek24307@gmail.com' ? {
      id: 999,
      name: 'Vivek Admin',
      email: 'vivek24307@gmail.com',
      userType: 'admin',
      district: 'Bengaluru',
      city_or_village: 'Yeshwantpur Mandi City'
    } : null);

    if (matchedUser) {
      const mockToken = 'demo-jwt-token-' + Date.now();
      login(mockToken, matchedUser);
      navigate('/');
    } else {
      setError('Demo login failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-emerald-50/30 to-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 mb-3">
          <Sprout className="w-8 h-8" />
        </div>
        <h2 className="font-display font-extrabold text-3xl tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <span>Welcome to Agro<span className="text-emerald-600">-Market</span></span>
          <span className="text-xs font-extrabold uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md border border-emerald-300">Beta</span>
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Direct Farmer & Buyer Marketplace &bull; SIH Edition
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-soft border border-slate-200/80">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50 focus:bg-white transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-display"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
              Quick 1-Click Demo Logins
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('farmer@example.com', 'password123')}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold text-center transition-all flex flex-col items-center gap-1"
              >
                <span>👨‍🌾</span>
                <span>Farmer Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('buyer@example.com', 'password123')}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-bold text-center transition-all flex flex-col items-center gap-1"
              >
                <span>🛒</span>
                <span>Buyer Demo</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('vivek24307@gmail.com', '12345678a')}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold text-center transition-all flex flex-col items-center gap-1"
              >
                <span>🛡️</span>
                <span>Admin</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-emerald-600 hover:text-emerald-700">
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
