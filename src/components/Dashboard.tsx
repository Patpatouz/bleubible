import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Calendar,
  Edit3,
  Bookmark,
  Quote,
  Sun,
  ChevronRight,
  Shield,
  Zap,
  Sparkles,
  Heart,
  Users,
  User,
  Activity,
  ArrowUpRight,
  Settings
} from "lucide-react";
import { geminiService } from "../services/geminiService";
import { parseBibleReference, findBook } from "../lib/bibleUtils";
import { verseOfTheDay, mockPlans } from "../data/mockData";
import { cn } from "../lib/utils";
import { BIBLE_BOOKS } from "../data/bibleBooks";
import { BibleLinker } from "./BibleLinker";
import { db } from "../lib/firebase";
import { collection, query, orderBy, limit, onSnapshot, getCountFromServer } from "firebase/firestore";

const IconMap: Record<string, any> = {
  Sun: Sun,
  Shield: Shield,
  Zap: Zap,
};

export default function Dashboard() {
  const navigate = useNavigate();

  const lastBookId = localStorage.getItem("bible-last-book") || "john";
  const lastChapterNum = parseInt(
    localStorage.getItem("bible-last-chapter") || "1",
    10,
  );
  const lastBook = BIBLE_BOOKS.find((b) => b.id === lastBookId) || BIBLE_BOOKS[0];

  const [isBookmarked, setIsBookmarked] = useState(() => {
    return localStorage.getItem("votd-bookmark") === "true";
  });

  // Community Pulse Stats
  const [latestPrayer, setLatestPrayer] = useState<{ text: string, userName: string } | null>(null);
  const [prayerCount, setPrayerCount] = useState<number>(0);

  useEffect(() => {
    // Fetch latest prayer for dashboard preview
    const q = query(collection(db, "prayers"), orderBy("createdAt", "desc"), limit(1));
    const unsubLatest = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setLatestPrayer({ text: data.text, userName: data.userName });
      }
    });

    // Fetch total count (rough estimation for live feel)
    const fetchCount = async () => {
      try {
        const snapshot = await getCountFromServer(collection(db, "prayers"));
        setPrayerCount(snapshot.data().count);
      } catch (e) {
        console.error("Count error", e);
      }
    };
    fetchCount();

    return () => unsubLatest();
  }, []);

  const toggleBookmark = () => {
    setIsBookmarked((prev) => {
      const next = !prev;
      localStorage.setItem("votd-bookmark", next.toString());
      return next;
    });
  };

  const categories = [
    {
      name: "Read",
      icon: BookOpen,
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
      path: "/bible",
    },
    {
      name: "Plan",
      icon: Calendar,
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20",
      path: "/plans",
    },
    {
      name: "Study",
      icon: Edit3,
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20",
      path: "/bible",
      state: { studyMode: true }
    },
    {
      name: "Bookmarks",
      icon: Bookmark,
      color: "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20",
      path: "/bookmarks",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-6 md:max-w-2xl md:mx-auto"
    >
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            Good Morning 👋
          </h1>
          <p className="text-app-text/50 text-sm">Let's spend time in the Word.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/settings')}
            className="p-3 bg-app-surface rounded-full hover:bg-app-text/10 transition-colors border border-app-border active:scale-95"
          >
            <Settings className="w-5 h-5 text-app-text/80" strokeWidth={1.25} />
          </button>
          <button className="p-3 bg-app-surface rounded-full hover:bg-app-text/10 transition-colors border border-app-border active:scale-95">
            <Bell className="w-5 h-5 text-app-text/80" strokeWidth={1.25} />
          </button>
        </div>
      </header>

      {/* Continue Reading Card */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg tracking-tight">
            Continue Reading
          </h2>
          <button
            onClick={() => {
              navigate("/bible", {
                state: {
                  bookName: lastBook.id,
                  chapter: lastChapterNum,
                },
              });
            }}
            className="text-brand-primary text-xs font-bold uppercase tracking-widest px-3 py-1 bg-brand-primary/5 rounded-lg hover:bg-brand-primary/10 transition-colors"
          >
            View all
          </button>
        </div>

        <button
          onClick={() => {
            navigate("/bible", {
              state: {
                bookName: lastBook.id,
                chapter: lastChapterNum,
              },
            });
          }}
          className="w-full bg-[#1C1F26]/30 backdrop-blur-xl border border-white/5 rounded-[28px] p-5 flex items-center gap-5 hover:bg-white/10 transition-all active:scale-[0.98]"
        >
          <div className="w-14 h-14 bg-brand-primary/5 border border-brand-primary/10 rounded-2xl flex items-center justify-center p-3">
            <BookOpen className="w-full h-full text-brand-primary" strokeWidth={1.25} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-bold text-xl mb-0.5">
              {lastBook.name} {lastChapterNum}
            </h3>
            <p className="text-app-text/30 text-xs mb-3 font-medium uppercase tracking-wider">
              Continue reading where you left off
            </p>

            <div className="w-full bg-app-text/5 h-1 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(lastChapterNum / lastBook.chapters) * 100}%`,
                }}
                className="bg-brand-primary h-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              />
            </div>
          </div>
          <div className="text-brand-primary font-bold text-sm bg-brand-primary/10 px-2 py-1 rounded-lg">
            {Math.round((lastChapterNum / lastBook.chapters) * 100)}%
          </div>
        </button>
      </section>

      {/* Categories Grid */}
      <section className="grid grid-cols-4 gap-4 mb-10 overflow-visible">
        {categories.map((cat) => (
          <div key={cat.name} className="flex flex-col items-center gap-3">
            <button
              onClick={() => {
                if (cat.path === "/bible") {
                  navigate("/bible", {
                    state: {
                      bookName: lastBook.id,
                      chapter: lastChapterNum,
                      ...(cat.state || {})
                    },
                  });
                } else {
                  navigate(cat.path);
                }
              }}
              className={cn(
                "w-full aspect-square rounded-[28px] flex items-center justify-center transition-all border active:scale-90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:-translate-y-1 group relative overflow-hidden",
                cat.color,
              )}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <cat.icon className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform" strokeWidth={1.25} />
            </button>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40 transition-colors">
              {cat.name}
            </span>
          </div>
        ))}
      </section>

      {/* Mood Assistant Section */}
      <section className="mb-10">
        <button 
          onClick={() => navigate("/assistant/mood")}
          className="w-full text-left bg-gradient-to-br from-brand-primary/20 to-brand-secondary/10 border border-brand-primary/20 rounded-[32px] p-6 relative overflow-hidden group active:scale-95 transition-all shadow-lg"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Spiritual Assistant</h2>
                  <p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/60">AI Personal Guidance</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-brand-primary/40 group-hover:translate-x-1 transition-all" />
            </div>

            <p className="text-white/60 text-sm leading-relaxed">
              How are you feeling today? Tap to find Scriptural wisdom and tailored reading plans for your current season.
            </p>
          </div>
        </button>
      </section>

      {/* Verse of the Day Card */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg tracking-tight">
            Verse of the Day
          </h2>
          <Sun className="w-5 h-5 text-brand-primary/40" strokeWidth={1.25} />
        </div>

        <article
          onClick={() => {
            const ref = parseBibleReference(verseOfTheDay.reference);
            if (ref) {
              navigate("/bible", {
                state: {
                  bookName: ref.bookName,
                  chapter: ref.chapter,
                  verse: ref.verse,
                },
              });
            } else {
              navigate("/bible");
            }
          }}
          className="bg-gradient-to-br from-[#1C1F26] to-[#121418] border border-white/5 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl cursor-pointer hover:border-brand-primary/30 active:scale-[0.99] transition-all hover:shadow-brand-primary/5"
        >
          <Quote className="absolute -top-4 -right-4 w-32 h-32 text-brand-primary/5 -rotate-12 group-hover:text-brand-primary/10 transition-colors" strokeWidth={1} />

          <blockquote className="relative z-10">
            <p className="text-lg font-medium leading-relaxed italic mb-8 text-app-text/70 font-serif group-hover:text-app-text transition-colors">
              "{verseOfTheDay.text}"
            </p>
            <footer className="flex justify-between items-end">
              <div className="group/ref">
                <p className="text-brand-primary/80 font-bold tracking-tight flex items-center gap-2">
                  {verseOfTheDay.reference}
                  <ChevronRight 
                    className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" 
                    strokeWidth={1.25} 
                  />
                </p>
                <p className="text-app-text/20 text-[9px] uppercase font-bold tracking-widest mt-1">
                  {verseOfTheDay.author}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark();
                }}
                className={cn(
                  "relative z-20 flex items-center justify-center w-11 h-11 border rounded-2xl transition-all shadow-sm",
                  isBookmarked
                    ? "bg-brand-primary text-white border-brand-primary shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
                    : "bg-app-surface border-app-border text-app-text/40 hover:text-app-text hover:bg-app-text/10",
                )}
              >
                <Bookmark
                  className={cn("w-5 h-5", isBookmarked ? "fill-current" : "")}
                  strokeWidth={1.25}
                />
              </button>
            </footer>
          </blockquote>
        </article>
      </section>

      {/* Community Pulse */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg tracking-tight flex items-center gap-2">
            Community Pulse
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          </h2>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Active Now</span>
        </div>
        
        <div className="bg-app-surface border border-app-border rounded-[32px] p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-brand-primary">
                <Users className="w-4 h-4" />
                <span className="text-xl font-black">{prayerCount || "0"}</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-app-text/20 uppercase">Total Prayers</p>
            </div>
            <div className="space-y-1 border-l border-app-border pl-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Activity className="w-4 h-4" />
                <span className="text-xl font-black">2.4k</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-app-text/20 uppercase">Global Activity</p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-app-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-app-text/40">Recent Members</span>
              <button 
                onClick={() => navigate("/plans/shared")}
                className="text-brand-primary text-[10px] font-bold"
              >
                Join them
              </button>
            </div>
            <div className="flex -space-x-3 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="inline-block h-10 w-10 rounded-full ring-2 ring-[#1C1F26] bg-white/5 flex items-center justify-center">
                  <User className="w-5 h-5 text-white/20" />
                </div>
              ))}
              <div className="inline-block h-10 w-10 rounded-full ring-2 ring-[#1C1F26] bg-brand-primary/20 flex items-center justify-center text-[10px] font-black text-brand-primary">
                +12
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reading Plans Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">Reading Plans</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-white/30 text-xs font-medium uppercase tracking-widest">Customized for your growth</p>
              <span className="w-1 h-1 bg-white/10 rounded-full" />
              <button 
                onClick={() => navigate("/plans/shared")}
                className="text-brand-primary/60 hover:text-brand-primary text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
              >
                Shared Plans <Users className="w-3 h-3" />
              </button>
            </div>
          </div>
          <button
            onClick={() => navigate("/plans")}
            className="w-10 h-10 border border-white/5 bg-white/5 rounded-xl flex items-center justify-center text-brand-primary/60 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={1.25} />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6">
          {mockPlans.map((plan) => {
            const PlanIcon = IconMap[plan.icon] || Sun;
            return (
              <button
                key={plan.id}
                onClick={() =>
                  navigate("/plans", { state: { selectedPlanId: plan.id } })
                }
                className="flex-shrink-0 w-[220px] p-6 bg-white/[0.03] border border-white/5 rounded-[28px] hover:border-brand-primary/20 transition-all text-left group"
              >
                <div className="w-11 h-11 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform group-hover:bg-brand-primary/5 group-hover:border-brand-primary/10">
                  <PlanIcon
                    className="w-5 h-5 text-brand-primary"
                    strokeWidth={1.25}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base mb-1 group-hover:text-brand-primary transition-colors line-clamp-1">
                    {plan.title}
                  </h3>
                  <p className="text-white/20 text-[9px] font-bold uppercase tracking-widest mb-4">
                    {plan.durationDays} Days • {plan.level}
                  </p>
                  
                  <div className="flex items-center gap-2 group-hover:gap-3 transition-all text-brand-primary/60 group-hover:text-brand-primary font-bold text-[9px] uppercase tracking-[0.2em]">
                    <span>Read Plan</span>
                    <ChevronRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick Access */}
      <section className="mb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Quick Access</h2>
          <button className="text-brand-primary/60 hover:text-brand-primary text-xs font-bold uppercase tracking-widest">
            Edit
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => navigate("/bookmarks")}
            className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.02] rounded-2xl group hover:bg-white/5 transition-colors"
          >
            <span className="font-medium text-white/50 group-hover:text-white/80 transition-colors text-sm">Bookmarks</span>
            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-brand-primary/60 transition-colors" strokeWidth={1.25} />
          </button>
          <button
            onClick={() => navigate("/journal")}
            className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.02] rounded-2xl group hover:bg-white/5 transition-colors"
          >
            <span className="font-medium text-white/50 group-hover:text-white/80 transition-colors text-sm">Study Journal</span>
            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-brand-primary/60 transition-colors" strokeWidth={1.25} />
          </button>
          <button
            onClick={() => navigate("/prayers")}
            className="flex items-center justify-between p-5 bg-brand-primary/10 border border-brand-primary/20 rounded-[28px] group hover:bg-brand-primary/15 transition-all shadow-lg shadow-brand-primary/5 active:scale-[0.98] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2">
               <ArrowUpRight className="w-4 h-4 text-brand-primary opacity-20" />
            </div>
            <div className="flex items-center gap-4 relative z-10 w-full">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center relative group-hover:scale-110 transition-transform shrink-0">
                <Heart className="w-6 h-6 text-brand-primary fill-brand-primary/10 group-hover:fill-brand-primary/20 transition-all" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1C1F26] animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1C1F26]" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="block font-bold text-brand-primary group-hover:text-brand-primary transition-colors text-base">Live Prayer Wall</span>
                  <div className="px-1.5 py-0.5 bg-brand-primary text-white text-[8px] font-black rounded uppercase tracking-tighter">NEW</div>
                </div>
                {latestPrayer ? (
                  <p className="text-[11px] text-white/40 line-clamp-1 italic mt-0.5">
                    "{latestPrayer.text}" — <span className="text-white/60 not-italic font-bold">{latestPrayer.userName}</span>
                  </p>
                ) : (
                  <span className="block text-[10px] text-brand-primary/40 uppercase font-black tracking-widest">Join Community Now</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
               <div className="text-right">
                 <span className="block text-[10px] font-black text-brand-primary animate-pulse">LIVE</span>
                 <span className="block text-[9px] font-bold text-white/20">{prayerCount > 0 ? `${prayerCount}+` : "--"}</span>
               </div>
               <ChevronRight className="w-5 h-5 text-brand-primary/40 group-hover:text-brand-primary transition-colors" strokeWidth={1.5} />
            </div>
          </button>
          <button
            className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/[0.02] rounded-2xl group hover:bg-white/5 transition-colors"
            onClick={() => navigate("/assistant/prayer")}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white/40" />
              </div>
              <span className="font-medium text-white/50 group-hover:text-white/80 transition-colors text-sm">AI Prayer Assistant</span>
            </div>
            <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-brand-primary/60 transition-colors" strokeWidth={1.25} />
          </button>
        </div>
      </section>
    </motion.div>
  );
}
