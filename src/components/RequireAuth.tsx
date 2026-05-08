import { useAuthState } from 'react-firebase-hooks/auth';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-dark-bg z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30 animate-pulse">Verifying Session</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
