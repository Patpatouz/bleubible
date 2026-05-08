import { motion } from 'motion/react';
import { 
  Settings, 
  Bell, 
  Heart, 
  Shield, 
  HelpCircle, 
  LogOut,
  LogIn,
  ChevronRight,
  UserCircle,
  Moon,
  Sun
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/ThemeContext';
import { cn } from '../lib/utils';

export default function Profile() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { name: 'Dark Mode', icon: theme === 'dark' ? Moon : Sun, action: toggleTheme, value: theme === 'dark' },
    { name: 'Account Settings', icon: UserCircle },
    { name: 'Notifications', icon: Bell },
    { name: 'My Favorites', icon: Heart },
    { name: 'Security & Privacy', icon: Shield },
    { name: 'Help & Support', icon: HelpCircle },
  ];

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:max-w-2xl md:mx-auto bg-app-bg min-h-screen"
    >
      <header className="flex justify-between items-center mb-8 px-1">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <button className="p-2.5 bg-app-surface border border-app-border rounded-2xl hover:bg-app-surface/80 transition-colors">
          <Settings className="w-5 h-5 text-app-text/30" strokeWidth={1.25} />
        </button>
      </header>

      {/* User Info */}
      <section className="flex flex-col items-center mb-10 p-8 rounded-[40px] bg-app-surface/50 border border-app-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="w-20 h-20 rounded-3xl bg-brand-primary p-0.5 bg-gradient-to-tr from-brand-primary/40 to-brand-secondary/40 mb-5 relative z-10">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || 'Profile'} 
              className="w-full h-full rounded-[22px] object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full rounded-[22px] bg-app-bg flex items-center justify-center text-2xl font-bold text-app-text/80">
              {getInitials(user?.displayName || 'User')}
            </div>
          )}
        </div>
        <h2 className="text-xl font-bold mb-1 relative z-10">{user?.displayName || 'Modern Disciple'}</h2>
        <p className="text-app-text/20 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
          {user?.email || 'spirit@bleubible.com'}
        </p>
        
        <div className="flex gap-8 mt-10 relative z-10">
          <div className="text-center">
            <p className="text-lg font-bold text-app-text/80">42</p>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-app-text/10">Streak</p>
          </div>
          <div className="w-px h-8 bg-app-border self-center" />
          <div className="text-center">
            <p className="text-lg font-bold text-app-text/80">12</p>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-app-text/10">Plans</p>
          </div>
          <div className="w-px h-8 bg-app-border self-center" />
          <div className="text-center">
            <p className="text-lg font-bold text-app-text/80">856</p>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-app-text/10">Verses</p>
          </div>
        </div>
      </section>

      {/* Menu List */}
      <section className="flex flex-col gap-2 pb-10">
        {menuItems.map((item) => (
          <button 
            key={item.name}
            onClick={item.action}
            className="flex items-center justify-between p-4 bg-app-surface/50 border border-app-border rounded-3xl group hover:bg-app-surface transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-app-text/5 flex items-center justify-center text-app-text/20 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
                <item.icon className="w-4 h-4" strokeWidth={1.25} />
              </div>
              <span className="font-bold text-sm text-app-text/60 group-hover:text-app-text transition-colors">{item.name}</span>
            </div>
            {item.name === 'Dark Mode' ? (
              <div className={cn(
                "w-10 h-5 rounded-full transition-all relative overflow-hidden",
                item.value ? "bg-brand-primary" : "bg-app-text/10"
              )}>
                <div className={cn(
                  "absolute top-1 left-1 bottom-1 aspect-square rounded-full transition-all bg-white shadow-sm",
                  item.value ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            ) : (
              <ChevronRight className="w-4 h-4 text-app-text/5 transition-all group-hover:translate-x-0.5 group-hover:text-app-text/20" strokeWidth={1.25} />
            )}
          </button>
        ))}
        
        {user ? (
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-4 p-5 mt-6 text-red-400/60 font-bold text-sm hover:bg-red-400/5 rounded-3xl transition-all active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.25} />
            <span>Sign Out</span>
          </button>
        ) : (
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-4 p-5 mt-6 text-brand-primary font-bold text-sm bg-brand-primary/10 border border-brand-primary/20 rounded-3xl transition-all active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" strokeWidth={1.25} />
            <span>Sign In for Backup</span>
          </button>
        )}
      </section>
    </motion.div>
  );
}
