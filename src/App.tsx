import { useState, useEffect, lazy, Suspense, type ReactNode } from 'react';
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
import { ThemeProvider, useTheme } from './lib/ThemeContext';

// Lazy load pages for performance
const Welcome = lazy(() => import('./components/Welcome'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const BibleReader = lazy(() => import('./components/BibleReader'));
const Plans = lazy(() => import('./components/Plans'));
const PlanDetail = lazy(() => import('./components/PlanDetail'));
const Profile = lazy(() => import('./components/Profile'));
const SettingsPage = lazy(() => import('./components/Settings'));
const PrayerWall = lazy(() => import('./components/PrayerWall'));
const SharedPlans = lazy(() => import('./components/SharedPlans'));
const SharedPlanView = lazy(() => import('./components/SharedPlanView'));
const Journal = lazy(() => import('./components/Journal'));
const Bookmarks = lazy(() => import('./components/Bookmarks'));
const PrayerAssistant = lazy(() => import('./components/PrayerAssistant'));
const MoodAssistant = lazy(() => import('./components/MoodAssistant'));
const PWABanner = lazy(() => import('./components/PWABanner'));

const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-app-bg z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-t-2 border-brand-primary animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-app-text/30 animate-pulse">Loading App</p>
    </div>
  </div>
);

const PageWrapper = ({ children }: { children: ReactNode }) => (
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
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const hideNav = location.pathname === '/' || location.pathname === '/welcome' || location.pathname.startsWith('/assistant');

  if (hideNav) return null;

  const prefetch = (path: string) => {
    switch(path) {
      case '/dashboard': import('./components/Dashboard'); break;
      case '/bible': import('./components/BibleReader'); break;
      case '/plans': import('./components/Plans'); break;
      case '/profile': import('./components/Profile'); break;
      case '/journal': import('./components/Journal'); break;
    }
  };

  return (
    <nav id="bottom-nav" className="fixed bottom-0 left-0 right-0 bg-app-bg/80 backdrop-blur-3xl border-t border-app-border flex items-center justify-around px-2 z-50 shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path === '/plans' && location.pathname.startsWith('/plans'));
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            onMouseEnter={() => prefetch(item.path)}
            onTouchStart={() => prefetch(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-all relative w-20 h-full group",
              isActive ? "text-brand-primary" : "text-app-text/50 hover:text-app-text/80 active:scale-95"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-all duration-500 flex items-center justify-center",
              isActive ? "bg-brand-primary/10 ring-1 ring-brand-primary/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]" : "group-hover:bg-app-text/10"
            )}>
              <item.icon 
                className={cn(
                  "w-5 h-5 transition-all duration-500",
                  isActive ? "text-brand-primary scale-110 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "text-current"
                )} 
                strokeWidth={isActive ? 2 : 1.75} 
              />
            </div>
            <span className={cn(
              "text-[9px] uppercase font-bold tracking-widest transition-all duration-500",
              isActive ? "text-brand-primary opacity-100" : "opacity-60 group-hover:opacity-100"
            )}>{item.name}</span>
            {isActive && (
              <motion.div 
                layoutId="nav-dot"
                className="w-8 h-[2px] rounded-full bg-brand-primary absolute bottom-1 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}

function AppContent() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen bg-app-bg text-app-text overflow-x-hidden transition-colors duration-500">
      <div className="immersive-bg">
        <div className="immersive-blur-1" />
        <div className="immersive-blur-2" />
      </div>
      
      <main className="relative z-10 min-h-screen pb-20">
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingFallback />}>
            <Routes location={location}>
              <Route path="/" element={<PageWrapper><Welcome /></PageWrapper>} />
              <Route path="/dashboard" element={<PageWrapper><Dashboard /></PageWrapper>} />
              <Route path="/bible" element={<PageWrapper><BibleReader /></PageWrapper>} />
              <Route path="/plans" element={<PageWrapper><Plans /></PageWrapper>} />
              <Route path="/plans/:planId" element={<PageWrapper><PlanDetail /></PageWrapper>} />
              <Route path="/plans/shared" element={<PageWrapper><SharedPlans /></PageWrapper>} />
              <Route path="/plans/shared/:planId" element={<PageWrapper><SharedPlanView /></PageWrapper>} />
              <Route path="/journal" element={<PageWrapper><Journal /></PageWrapper>} />
              <Route path="/bookmarks" element={<PageWrapper><Bookmarks /></PageWrapper>} />
              <Route path="/prayers" element={<PageWrapper><PrayerWall /></PageWrapper>} />
              <Route path="/settings" element={<PageWrapper><SettingsPage /></PageWrapper>} />
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

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </BrowserRouter>
  );
}

