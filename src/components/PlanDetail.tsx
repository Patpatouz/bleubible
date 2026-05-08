import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  MoreHorizontal,
  Bookmark,
  Sun,
  Clock,
  Zap,
  CheckCircle2,
  Share2,
  Circle,
  Play,
  Users,
  Star,
  ArrowRight,
  Target,
  ChevronRight,
  BookOpen,
  X,
  Loader2,
  Cloud,
  Sparkles
} from "lucide-react";
import { mockPlans } from "../data/mockData";
import { useState, useEffect, useRef } from "react";
import { StudyPlan } from "../types";
import { cn } from "../lib/utils";
import { parseBibleReference } from "../lib/bibleUtils";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const IconMap: Record<string, any> = {
  Sun: Sun,
  Shield: Sun, // Fallback
  Zap: Zap,
};

export default function PlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [guideModal, setGuideModal] = useState<{ open: boolean; task: string }>({ open: false, task: "" });
  const [completedTasks, setCompletedTasks] = useState<Record<string, string[]>>({});
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [reflectiveModal, setReflectiveModal] = useState<{ open: boolean; task: string; question: string }>({ open: false, task: "", question: "" });
  const [journalContent, setJournalContent] = useState("");
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  const isInitialLoadRef = useRef(true);

  const REFLECTION_QUESTIONS = [
    "What did this passage teach you about love today?",
    "How can you apply this teaching to your current challenges?",
    "What part of this reading resonated most with your spirit?",
    "What is God speaking to you through this specific chapter?",
    "How does this passage change your perspective on gratitude?"
  ];

  useEffect(() => {
    const plan = mockPlans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(plan);
    } else {
      navigate("/plans");
    }
  }, [planId, navigate]);

  // Sync Logic (copied from Plans.tsx for consistency)
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

  if (!selectedPlan) return null;

  const toggleTask = (pId: string, task: string) => {
    setCompletedTasks((prev) => {
      const planTasks = prev[pId] || [];
      const isNewlyCompleted = !planTasks.includes(task);
      const updated = isNewlyCompleted
        ? [...planTasks, task]
        : planTasks.filter((t) => t !== task);

      if (isNewlyCompleted) {
        const randomQuestion = REFLECTION_QUESTIONS[Math.floor(Math.random() * REFLECTION_QUESTIONS.length)];
        setReflectiveModal({ open: true, task, question: randomQuestion });
        setJournalContent("");
      }

      return { ...prev, [pId]: updated };
    });
  };

  const saveReflection = async () => {
    if (!user || !journalContent.trim()) return;
    setIsSavingJournal(true);
    try {
      const { journalService } = await import("../services/journalService");
      await journalService.createEntry({
        content: journalContent,
        prompt: reflectiveModal.question,
        title: `Reflection: ${reflectiveModal.task}`,
      });
      setReflectiveModal({ ...reflectiveModal, open: false });
      setJournalContent("");
    } catch (error) {
      console.error("Error saving reflection:", error);
    } finally {
      setIsSavingJournal(false);
    }
  };

  const startPlan = (plan: StudyPlan) => {
    setActivePlanId(plan.id);
  };

  const PlanIcon = ({ name, className, strokeWidth }: any) => {
    const Icon = IconMap[name] || Sun;
    return <Icon className={className} strokeWidth={strokeWidth} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="pb-32 min-h-screen bg-app-bg p-6 md:max-w-2xl md:mx-auto"
    >
      {/* Detail Header */}
      <header className="flex justify-between items-center mb-8 sticky top-0 z-30 pt-4 bg-app-bg/80 backdrop-blur-xl pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center bg-app-surface border border-app-border rounded-xl text-app-text/40 hover:text-app-text transition-colors"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={1.25} />
          </button>
          {user && (
            <div className={cn(
              "p-1.5 rounded-full",
              isSyncing ? "animate-pulse text-brand-primary" : "text-white/20"
            )} title={isSyncing ? "Syncing progress..." : "Progress Synced"}>
              <Cloud className="w-4 h-4" strokeWidth={1.5} />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
            <Bookmark className="w-4 h-4" strokeWidth={1.25} />
          </button>
          <button className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.25} />
          </button>
        </div>
      </header>

      {/* Immersive Hero Header */}
      <div className="relative mb-8 p-10 rounded-[40px] overflow-hidden bg-white/[0.02] border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-20 h-20 bg-brand-primary/5 rounded-[28px] flex items-center justify-center relative mb-8 border border-brand-primary/10"
          >
            <PlanIcon
              name={selectedPlan.icon}
              className="w-8 h-8 text-brand-primary"
              strokeWidth={1.25}
            />
          </motion.div>

          <h1 className="text-3xl font-bold mb-3 tracking-tight leading-tight">{selectedPlan.title}</h1>
          
          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-white/20 mb-8 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" strokeWidth={1.25} /> {selectedPlan.durationDays} DAYS</span>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <span className="flex items-center gap-1.5 text-brand-primary/60"><Zap className="w-3 h-3" strokeWidth={1.25} /> {selectedPlan.level}</span>
          </div>

          <p className="text-white/40 leading-relaxed max-w-[280px] font-medium text-sm mb-10">
            {selectedPlan.description}
          </p>

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-white/80">4.8k</span>
              <span className="text-[7px] font-black uppercase tracking-widest text-white/10">Read</span>
            </div>
            <div className="w-px h-6 bg-white/5" />
            <div className="flex flex-col items-center text-center">
              <div className="flex gap-0.5 mb-1 justify-center items-center">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-2 h-2 text-brand-primary/40 fill-brand-primary/40" strokeWidth={1.25} />)}
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-white/10">Rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Control */}
      <div className="flex gap-3 mb-10">
        {activePlanId !== selectedPlan.id ? (
          <button
            onClick={() => startPlan(selectedPlan)}
            className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-primary/10 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Play className="w-4 h-4 fill-current" strokeWidth={1.25} />
            Join This Plan
          </button>
        ) : (
          <button className="flex-1 bg-brand-primary/5 border border-brand-primary/10 text-brand-primary font-bold py-4 rounded-2xl flex items-center justify-center gap-3">
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.25} />
            Active Plan
          </button>
        )}
        <button className="w-14 bg-white/5 border border-white/5 text-white/20 hover:text-white rounded-2xl flex items-center justify-center active:scale-90 transition-all">
          <Share2 className="w-5 h-5" strokeWidth={1.25} />
        </button>
      </div>

      {/* Daily Timeline */}
      <section className="mb-12 overflow-visible">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold mb-0">Timeline</h2>
          <div className="bg-white/5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white/40">
            Day 4 of {selectedPlan.durationDays}
          </div>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 px-1 no-scrollbar -mx-1">
          {Array.from({ length: selectedPlan.durationDays }).map((_, i) => {
            const dayNum = i + 1;
            const isCurrent = dayNum === 4;
            const isPast = dayNum < 4;
            return (
              <button
                key={i}
                className={cn(
                  "flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all",
                  isCurrent 
                    ? "bg-brand-primary border-brand-primary shadow-lg shadow-brand-primary/20 text-white" 
                    : isPast
                      ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                      : "bg-white/5 border-white/5 text-white/30"
                )}
              >
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Day</span>
                <span className="text-2xl font-black leading-none">{dayNum}</span>
                {isPast && <CheckCircle2 className="w-3 h-3 absolute top-2 right-2" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* Today's Focus Section */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-primary/20 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold leading-tight">Today's Focus</h2>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Building your foundation</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {selectedPlan.tasks.map((task, idx) => {
            const isCompleted = completedTasks[selectedPlan.id]?.includes(task);
            const bibleRef = parseBibleReference(task);
            
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-4 p-6 rounded-[32px] border transition-all text-left group overflow-hidden relative",
                  isCompleted
                    ? "bg-brand-primary/5 border-brand-primary/20 opacity-80"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10",
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleTask(selectedPlan.id, task)}
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all relative z-10",
                    isCompleted
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "bg-white/5 text-white/20 border border-white/5",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                
                {/* Task Info */}
                <div className="flex-1 relative z-10">
                  <span
                    className={cn(
                      "font-bold text-lg block transition-all mb-1",
                      isCompleted
                        ? "text-white/50 line-through"
                        : "text-white/90",
                    )}
                  >
                    {task}
                  </span>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 truncate max-w-[80px]">15 min study</span>
                     <div className="w-1 h-1 bg-white/10 rounded-full flex-shrink-0" />
                     <button 
                       onClick={() => setGuideModal({ open: true, task })}
                       className="text-[10px] font-bold uppercase tracking-wider text-brand-primary/60 underline decoration-brand-primary/30 hover:text-brand-primary transition-colors whitespace-nowrap"
                     >
                       View Guide
                     </button>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => {
                    if (bibleRef) {
                      navigate("/bible", { state: bibleRef });
                    } else if (task.toLowerCase().includes("read")) {
                      navigate("/bible");
                    } else {
                       setGuideModal({ open: true, task });
                    }
                  }}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all flex-shrink-0",
                    bibleRef || task.toLowerCase().includes("read")
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95"
                      : "bg-white/5 text-white/20 hover:bg-white/10"
                  )}
                >
                  {bibleRef ? (
                    <BookOpen className="w-5 h-5" />
                  ) : task.toLowerCase().includes("read") ? (
                    <ArrowRight className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <div className="absolute top-0 right-0 bottom-0 w-1 bg-brand-primary opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            );
          })}
        </div>
      </section>

      {/* Guide Modal */}
      <AnimatePresence>
        {guideModal.open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setGuideModal({ ...guideModal, open: false })}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1C1F26] border border-white/10 rounded-[32px] sm:rounded-[40px] w-full max-w-[calc(100vw-48px)] sm:max-w-sm relative z-10 overflow-y-auto max-h-[80vh] shadow-2xl"
            >
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-brand-primary" />
                  </div>
                  <button 
                    onClick={() => setGuideModal({ ...guideModal, open: false })}
                    className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-2xl font-bold mb-2">Study Guide</h3>
                <button onClick={() => {
                  const ref = parseBibleReference(guideModal.task);
                  if (ref) { navigate("/bible", { state: ref }); setGuideModal({ ...guideModal, open: false }); }
                }} className="text-brand-primary font-bold text-sm mb-6 uppercase tracking-wider hover:underline text-left">
                  {guideModal.task}
                </button>
                <div className="space-y-6 text-white/60 leading-relaxed">
                  <section>
                    <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-2 px-1">Context</h4>
                    <p className="text-sm bg-white/5 p-4 rounded-2xl border border-white/5">
                      Consider the historical context. God is speaking to you through these words today.
                    </p>
                  </section>
                  <section>
                    <h4 className="text-white font-bold text-xs uppercase tracking-[0.2em] mb-2 px-1">Reflection</h4>
                    <p className="text-sm">
                      1. How does this challenge your perspective?<br/>
                      2. Practical steps?<br/>
                      3. Ask for guidance.
                    </p>
                  </section>
                </div>
                <button 
                  onClick={() => setGuideModal({ ...guideModal, open: false })}
                  className="w-full bg-brand-primary text-white font-bold py-4 rounded-2xl mt-8 shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
                >
                  Clear Understanding
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {reflectiveModal.open && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReflectiveModal({ ...reflectiveModal, open: false })}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-[#1C1F26] border border-white/10 rounded-[40px] w-full max-w-sm relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-brand-primary" />
                   </div>
                   <button 
                     onClick={() => setReflectiveModal({ ...reflectiveModal, open: false })}
                     className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <h3 className="text-2xl font-bold mb-2">Daily Reflection</h3>
                 <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] mb-6">Task Completed: {reflectiveModal.task}</p>
                 
                 <div className="bg-white/[0.03] border border-white/5 p-6 rounded-[32px] mb-6">
                   <p className="text-white/80 font-medium leading-relaxed italic mb-4">
                     "{reflectiveModal.question}"
                   </p>
                   <textarea
                     value={journalContent}
                     onChange={(e) => setJournalContent(e.target.value)}
                     placeholder="Type your reflection here..."
                     className="w-full bg-transparent border-none focus:ring-0 text-sm text-white/60 placeholder:text-white/10 resize-none h-32 no-scrollbar"
                   />
                 </div>
                 
                 <button 
                  onClick={saveReflection}
                  disabled={isSavingJournal || !journalContent.trim()}
                  className="w-full bg-brand-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isSavingJournal ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  Save to Journal
                </button>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </motion.div>
  );
}
