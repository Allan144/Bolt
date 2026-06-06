import React, { useState } from 'react';
import { Music, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { loginUser, registerUser, AppUser } from '../lib/auth';

interface AuthFormProps {
  onAuthSuccess: (user: AppUser) => void;
  onBack: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess, onBack }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user: AppUser;
      if (mode === 'login') {
        user = await loginUser(email, password);
      } else {
        if (!displayName.trim()) { setError('Display name is required'); setLoading(false); return; }
        user = await registerUser(email, password, displayName);
      }
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url('https://images.pexels.com/photos/164821/pexels-photo-164821.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
      }}>
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-stone-900/90 backdrop-blur-xl border border-stone-700/50 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-700/80 border border-amber-600/40 flex items-center justify-center mb-4">
              <Music className="w-7 h-7 text-amber-200" />
            </div>
            <h1 className="text-white font-serif text-2xl">LCE Lessons</h1>
            <p className="text-stone-400 text-sm mt-1">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-stone-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full bg-stone-800 border border-stone-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-colors placeholder-stone-600"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-stone-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-600 transition-colors placeholder-stone-600"
                  placeholder="teacher@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-400 text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 text-white rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:border-amber-600 transition-colors placeholder-stone-600"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm mt-2"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-amber-500 hover:text-amber-400 text-sm transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
