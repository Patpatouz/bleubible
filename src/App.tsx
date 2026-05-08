import { useState, useEffect, lazy, Suspense } from 'react';
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
  Sun,
  Loader2
} from 'lucide-react';
import { cn } from './lib/utils';

// Lazy load pages for performance
const Welcome = lazy(() => import('./components/Welcome'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const BibleReader = lazy(() => import('./components/BibleReader'));
const Plans = lazy(() => import('./components/Plans'));
const PlanDetail = lazy(() => import('./components/PlanDetail'));
const Profile = lazy(() => import('./components/Profile'));
const PrayerWall = lazy(() => import('./components/PrayerWall'));
const SharedPlans = lazy(() => import('./components/SharedPlans'));
const SharedPlanView = lazy(() => import('./components/SharedPlanView'));
const PrayerAssistant = lazy(() => import('./components/PrayerAssistant'));
const MoodAssistant = lazy(() => import('./components/MoodAssistant'));
const PWABanner = lazy(() => import('./components/PWABanner'));

const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-dark-bg z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-t-2 border-brand-primary animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-white/30 animate-pulse">Loading App</p>
    </div>
  </div>
);

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -10, scale: 0.99 }}
    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
    className="w-full"
  >
    {children}
  </motion.div>
);

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

  const prefetch = (path: string) => {
    switch(path) {
      case '/dashboard': import('./components/Dashboard'); break;
      case '/bible': import('./components/BibleReader'); break;
      case '/plans': import('./components/Plans'); break;
      case '/profile': import('./components/Profile'); break;
    }
  };

  return (
    <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-dark-navbar/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path === '/plans' && location.pathname.startsWith('/plans'));
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            onMouseEnter={() => prefetch(item.path)}
            onTouchStart={() => prefetch(item.path)}
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
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-dark-bg text-[#E2E8F0] overflow-x-hidden transition-colors duration-500">
      <div className="immersive-bg">
        <div className="immersive-blur-1" />
        <div className="immersive-blur-2" />
      </div>
      
      <main className="relative z-10 min-h-screen pb-20">
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingFallback />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageWrapper><Welcome /></PageWrapper>} />
              <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/bible" element={<PageWrapper><BibleReader /></PageWrapper>} />
              <Route path="/plans" element={<PageWrapper><Plans /></PageWrapper>} />
              <Route path="/plans/:planId" element={<PageWrapper><PlanDetail /></PageWrapper>} />
              <Route path="/plans/shared" element={<PageWrapper><SharedPlans /></PageWrapper>} />
              <Route path="/plans/shared/:planId" element={<PageWrapper><SharedPlanView /></PageWrapper>} />
              <Route path="/prayers" element={<PageWrapper><PrayerWall /></PageWrapper>} />
              <Route path="/profile" element={<PageWrapper><Profile /></PageWrapper>} />
              <Route path="/assistant/prayer" element={<PageWrapper><PrayerAssistant /></PageWrapper>} />
              <Route path="/assistant/mood" element={<PageWrapper><MoodAssistant /></PageWrapper>} />
            </Routes>
          </Suspense>
        </AnimatePresence>
      </main>
      <Navigation />
      <PWABanner />
    </div>
  );
}

