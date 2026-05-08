import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogIn, Loader2 } from 'lucide-react';
import { auth, signInWithGoogle } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect, useState } from 'react';

export default function Welcome() {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in failed:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen px-8 text-center bg-dark-bg text-white"
    >
      <div className="relative mb-14">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="w-28 h-28 bg-brand-primary/[0.03] rounded-[40px] flex items-center justify-center p-7 bible-glow border border-brand-primary/10">
            <BookOpen className="w-full h-full text-brand-primary/80" strokeWidth={1.25} />
          </div>
        </motion.div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-primary/5 blur-3xl -z-0" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2 className="text-xs font-black uppercase tracking-[0.3em] mb-3 text-white/20">Welcome to</h2>
        <h1 className="text-5xl font-bold tracking-tight mb-8">
          <span className="text-white">Bleu</span>
          <span className="text-brand-primary">Bible</span>
        </h1>
        
        <p className="text-white/30 text-base mb-16 leading-relaxed max-w-[280px] font-medium">
          Your spiritual companion for a modern life of faith and wisdom.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <button 
            onClick={handleSignIn}
            disabled={isSigningIn || loading}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-5 rounded-2xl transition-all active:scale-95 shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSigningIn || (loading && !user) ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isSigningIn ? 'Signing in...' : 'Get Started with Google'}
          </button>
          
          <button 
            onClick={handleSignIn}
            disabled={isSigningIn || loading}
            className="text-white/20 text-xs font-black uppercase tracking-widest py-3 hover:text-brand-primary transition-colors disabled:opacity-30"
          >
            Already have an account? <span className="text-brand-primary/80 underline underline-offset-4 decoration-brand-primary/20">Sign in</span>
          </button>
        </div>
      </motion.div>

      <div className="mt-12 flex gap-2">
        <div className="w-6 h-1.5 rounded-full bg-brand-primary" />
        <div className="w-2 h-1.5 rounded-full bg-white/20" />
        <div className="w-2 h-1.5 rounded-full bg-white/20" />
      </div>
    </motion.div>
  );
}
