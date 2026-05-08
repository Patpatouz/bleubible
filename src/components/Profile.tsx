import { motion } from 'motion/react';
import { 
  Settings, 
  Bell, 
  Heart, 
  Shield, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  UserCircle
} from 'lucide-react';

export default function Profile() {
  const menuItems = [
    { name: 'Account Settings', icon: UserCircle },
    { name: 'Notifications', icon: Bell },
    { name: 'My Favorites', icon: Heart },
    { name: 'Security & Privacy', icon: Shield },
    { name: 'Help & Support', icon: HelpCircle },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6 md:max-w-2xl md:mx-auto bg-dark-bg min-h-screen"
    >
      <header className="flex justify-between items-center mb-8 px-1">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <button className="p-2.5 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
          <Settings className="w-5 h-5 text-white/30" strokeWidth={1.25} />
        </button>
      </header>

      {/* User Info */}
      <section className="flex flex-col items-center mb-10 p-8 rounded-[40px] bg-white/[0.02] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="w-20 h-20 rounded-3xl bg-brand-primary p-0.5 bg-gradient-to-tr from-brand-primary/40 to-brand-secondary/40 mb-5 relative z-10">
          <div className="w-full h-full rounded-[22px] bg-dark-bg flex items-center justify-center text-2xl font-bold text-white/80">
            NM
          </div>
        </div>
        <h2 className="text-xl font-bold mb-1 relative z-10">Nazuwa Mabika</h2>
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">Joined June 2024</p>
        
        <div className="flex gap-8 mt-10 relative z-10">
          <div className="text-center">
            <p className="text-lg font-bold text-white/80">42</p>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/10">Streak</p>
          </div>
          <div className="w-px h-8 bg-white/5 self-center" />
          <div className="text-center">
            <p className="text-lg font-bold text-white/80">12</p>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/10">Plans</p>
          </div>
          <div className="w-px h-8 bg-white/5 self-center" />
          <div className="text-center">
            <p className="text-lg font-bold text-white/80">856</p>
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-white/10">Verses</p>
          </div>
        </div>
      </section>

      {/* Menu List */}
      <section className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button 
            key={item.name}
            className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.02] rounded-3xl group hover:bg-white/5 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-brand-primary group-hover:bg-brand-primary/10 transition-all">
                <item.icon className="w-4 h-4" strokeWidth={1.25} />
              </div>
              <span className="font-bold text-sm text-white/60 group-hover:text-white transition-colors">{item.name}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/5 transition-all group-hover:translate-x-0.5 group-hover:text-white/20" strokeWidth={1.25} />
          </button>
        ))}
        
        <button className="flex items-center gap-4 p-5 mt-6 text-red-400/60 font-bold text-sm hover:bg-red-400/5 rounded-3xl transition-all active:scale-[0.98]">
          <LogOut className="w-5 h-5" strokeWidth={1.25} />
          <span>Sign Out</span>
        </button>
      </section>
    </motion.div>
  );
}
