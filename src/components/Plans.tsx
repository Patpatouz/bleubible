import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  MoreHorizontal,
  Bookmark,
  Sun,
  Clock,
  Zap,
  CheckCircle2,
  Share2,
  TrendingUp,
  Filter,
  Shield,
  Circle,
  Play,
  Users,
  Search,
  Star,
  ArrowRight,
  Target,
  ChevronRight,
  BookOpen,
  X,
} from "lucide-react";
import { mockPlans } from "../data/mockData";
import { BIBLE_BOOKS } from "../data/bibleBooks";
import { useState, useEffect, useMemo, useRef } from "react";
import { StudyPlan } from "../types";
import { cn } from "../lib/utils";
import { parseBibleReference } from "../lib/bibleUtils";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { Cloud, CloudOff, Loader2 } from "lucide-react";

const IconMap: Record<string, any> = {
  Sun: Sun,
  Shield: Shield,
  Zap: Zap,
};

export default function Plans() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [isSyncing, setIsSyncing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem("plan-completed-tasks");
    return saved ? JSON.parse(saved) : {};
  });
  const [activePlanId, setActivePlanId] = useState<string | null>(() => {
    return localStorage.getItem("active-plan-id");
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const isInitialLoadRef = useRef(true);

  // --- FIREBASE SYNC LOGIC ---
  // 1. Initial Load from Firebase
  useEffect(() => {
    if (!user) return;

    const loadSyncData = async () => {
      setIsSyncing(true);
      try {
        const progressRef = doc(db, "users", user.uid, "settings", "plans");
        const docSnap = await getDoc(progressRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.completedTasks) setCompletedTasks(data.completedTasks);
          if (data.activePlanId) setActivePlanId(data.activePlanId);
        }
      } catch (error) {
        console.error("Error loading plans sync data:", error);
      } finally {
        setIsSyncing(false);
        isInitialLoadRef.current = false;
      }
    };

    loadSyncData();
  }, [user]);

  // 2. Debounced Save to Firebase
  useEffect(() => {
    if (!user || isInitialLoadRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const progressRef = doc(db, "users", user.uid, "settings", "plans");
        await setDoc(progressRef, {
          completedTasks,
          activePlanId,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        console.error("Plans sync preservation failed:", error);
      }
    }, 2000); 

    return () => clearTimeout(timer);
  }, [user, completedTasks, activePlanId]);
  // --- END FIREBASE SYNC LOGIC ---

  useEffect(() => {
    localStorage.setItem("plan-completed-tasks", JSON.stringify(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    if (activePlanId) {
      localStorage.setItem("active-plan-id", activePlanId);
    }
  }, [activePlanId]);

  const PlanIcon = ({
    name,
    className,
    strokeWidth,
  }: {
    name: string;
    className?: string;
    strokeWidth?: number;
  }) => {
    const Icon = IconMap[name] || Sun;
    return <Icon className={className} strokeWidth={strokeWidth} />;
  };

  const filteredPlans = useMemo(() => {
    return mockPlans.filter(plan => {
      const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || 
        (activeCategory === "Beginner" && plan.level === "Beginner") ||
        (activeCategory === "Deep Study" && plan.level === "Advanced") ||
        (activeCategory === "Growth" && plan.level === "Intermediate");
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const categories = ["All", "Beginner", "Growth", "Deep Study"];

  return (
    <div className="p-6 md:max-w-2xl md:mx-auto bg-app-bg min-h-screen pb-32">
      <AnimatePresence mode="wait">
        <motion.div
          key="list"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
            {/* List Header */}
            <header className="flex justify-between items-center mb-10 mt-2">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-2xl font-bold tracking-tight">
                    Discover Plans
                  </h1>
                  {user && (
                    <div className={cn(
                      "p-1.5 rounded-full",
                      isSyncing ? "animate-pulse text-brand-primary" : "text-white/20"
                    )} title={isSyncing ? "Syncing progress..." : "Progress Synced"}>
                      <Cloud className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" strokeWidth={1.25} />
                  <input 
                    type="text"
                    placeholder="Search for a topic or book..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-brand-primary/30 focus:bg-white/10 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <button className="w-11 h-11 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-center text-white/30 hover:text-white transition-colors self-end active:scale-90">
                <Filter className="w-4 h-4" strokeWidth={1.25} />
              </button>
            </header>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                    activeCategory === cat
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "bg-white/5 text-white/40 hover:bg-white/10"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Featured Plan */}
            {!searchQuery && activeCategory === "All" && (
              <section className="mb-12">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-4 px-1">
                  Plan of the Week
                </h2>
                <button 
                  onClick={() => navigate(`/plans/${mockPlans[2].id}`)}
                  className="w-full relative rounded-[32px] overflow-hidden group border border-white/5"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                  <div className="h-60 bg-brand-primary/20 flex items-center justify-center relative">
                    <Zap className="w-20 h-20 text-brand-primary/20 group-hover:scale-125 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--brand-primary)_0%,_transparent_70%)] opacity-10" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-left">
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-brand-primary fill-brand-primary" />
                      <span className="text-brand-primary text-sm font-bold uppercase tracking-wider">Top Rated</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                      Deep Dive: Romans
                    </h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-1">
                      Explore the foundational theology of grace and faith.
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-white/40 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 30 DAYS</span>
                      <span className="flex items-center gap-1.5 text-brand-primary"><Zap className="w-3.5 h-3.5" /> ADVANCED</span>
                    </div>
                  </div>
                </button>
              </section>
            )}

            {/* Progress Summary if active */}
            {activePlanId && (
              <section className="mb-12">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-4 px-1">
                  My Active Plan
                </h2>
                <button 
                  onClick={() => {
                    navigate(`/plans/${activePlanId}`);
                  }}
                  className="w-full bg-[#1C1F26] border border-brand-primary/20 rounded-3xl p-6 relative overflow-hidden group hover:border-brand-primary/40 transition-all"
                >
                  <TrendingUp className="absolute top-4 right-4 w-12 h-12 text-brand-primary/10 group-hover:scale-110 transition-transform" />
                  <div className="relative z-10 text-left">
                    <h3 className="text-xl font-bold mb-1">
                      {mockPlans.find((p) => p.id === activePlanId)?.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="w-5 h-5 rounded-full border border-black bg-white/10 flex items-center justify-center overflow-hidden">
                            <Users className="w-3 h-3 opacity-30" />
                          </div>
                        ))}
                      </div>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider">
                        +12k Others Reading
                      </p>
                    </div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Progress</span>
                      <span className="text-xs font-bold text-brand-primary">4 of 7 Days</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[57%] h-full bg-brand-primary shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    </div>
                  </div>
                </button>
              </section>
            )}

            {/* Plans List */}
            <section className="space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10 mb-4 px-1">
                {activeCategory === "All" ? "Recommended for you" : `${activeCategory} Plans`}
              </h2>
              <div className="grid gap-3">
                {filteredPlans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => navigate(`/plans/${plan.id}`)}
                    className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.02] rounded-3xl hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="w-14 h-14 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center p-3.5 group-hover:scale-105 transition-transform">
                      <PlanIcon
                        name={plan.icon}
                        className="w-full h-full text-brand-primary/60 group-hover:text-brand-primary transition-colors"
                        strokeWidth={1.25}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-base group-hover:text-brand-primary transition-colors">
                          {plan.title}
                        </h3>
                      </div>
                      <div className="flex gap-4 text-[9px] uppercase font-bold tracking-widest text-white/20">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" strokeWidth={1.25} /> {plan.durationDays} Days
                        </span>
                        <span className="flex items-center gap-1 text-brand-primary/30 group-hover:text-brand-primary/50 transition-colors">
                          <Zap className="w-3 h-3" strokeWidth={1.25} /> {plan.level}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/5 group-hover:text-white/20 transition-all group-hover:translate-x-1" strokeWidth={1.25} />
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
      </AnimatePresence>
    </div>
  );
}
