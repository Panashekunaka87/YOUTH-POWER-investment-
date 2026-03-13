import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, Mail, Lock, User, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        // Store referral code in session storage to be picked up by AuthContext
        if (referralCode) {
          sessionStorage.setItem('pendingReferral', referralCode);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-900 px-6 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white text-emerald-900 shadow-2xl shadow-emerald-500/20">
            <span className="text-3xl font-black">YP</span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter">YOUTHS POWER 🫂</h1>
          <p className="mt-1 text-sm text-emerald-100/60">Empowering the next generation</p>
        </div>

        <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl border border-white/10">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-200">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-2xl bg-white/10 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="John Doe"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold uppercase tracking-widest text-emerald-200">Referral Code (Optional)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="w-full rounded-2xl bg-white/10 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                      placeholder="ABCDEF"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-200">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl bg-white/10 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-200">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl bg-white/10 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-4 font-bold text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="my-6 flex items-center gap-4 text-xs font-bold text-emerald-300/50 uppercase">
            <div className="h-px flex-1 bg-white/10" />
            <span>OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-4 font-bold text-emerald-900 shadow-xl transition-transform active:scale-95 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
            Continue with Google
          </button>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-bold text-emerald-300 hover:text-white"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl bg-red-500/20 p-4 text-center text-sm font-medium text-red-200 border border-red-500/30"
          >
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
