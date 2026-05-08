import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, 
  BookOpen, 
  Calendar, 
  User, 
  Search, 
  Bookmark, 
  BookMarked,
  Bell,
  ChevronLeft,
  MoreHorizontal,
  Play,
  Settings,
  Sun
} from 'lucide-react';
import { cn } from './lib/utils';

// Pages
import Welcome from './components/Welcome';
import Dashboard from './components/Dashboard';
import BibleReader from './components/BibleReader';
import Plans from './components/Plans';
import PlanDetail from './components/PlanDetail';
import Profile from './components/Profile';
import PrayerWall from './components/PrayerWall';
import SharedPlans from './components/SharedPlans';
import SharedPlanView from './components/SharedPlanView';
import PrayerAssistant from './components/PrayerAssistant';
import MoodAssistant from './components/MoodAssistant';

function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: HomeIcon },
    { name: 'Bible', path: '/bible', icon: BookOpen },
    { name: 'Plans', path: '/plans', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const hideNav = location.pathname === '/' || location.pathname === '/welcome' || location.pathname.startsWith('/assistant');

  if (hideNav) return null;

  return (
    <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 h-20 bg-dark-navbar/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path === '/plans' && location.pathname.startsWith('/plans'));
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all relative",
              isActive ? "text-brand-primary" : "text-white/20 hover:text-white/40 active:scale-90"
            )}
          >
            <item.icon className="w-6 h-6 text-current" strokeWidth={1.25} />
            <span className={cn(
              "text-[9px] uppercase font-black tracking-[0.2em] transition-all",
              isActive ? "opacity-100" : "opacity-40"
            )}>{item.name}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-dot"
                className="w-1 h-1 rounded-full bg-brand-primary absolute -bottom-3"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="relative min-h-screen bg-dark-bg text-[#E2E8F0] overflow-x-hidden transition-colors duration-500">
        <div className="immersive-bg">
          <div className="immersive-blur-1" />
          <div className="immersive-blur-2" />
        </div>
        
        <main className="relative z-10 min-h-screen pb-20">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/bible" element={<BibleReader />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/plans/:planId" element={<PlanDetail />} />
              <Route path="/plans/shared" element={<SharedPlans />} />
              <Route path="/plans/shared/:planId" element={<SharedPlanView />} />
              <Route path="/prayers" element={<PrayerWall />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/assistant/prayer" element={<PrayerAssistant />} />
              <Route path="/assistant/mood" element={<MoodAssistant />} />
            </Routes>
          </AnimatePresence>
        </main>
        <Navigation />
      </div>
    </BrowserRouter>
  );
}
