import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2, 
  MessageSquare, 
  Send,
  User,
  Calendar,
  Sparkles,
  Loader2,
  Share2,
  MoreVertical,
  Check
} from "lucide-react";
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from "../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  setDoc,
  orderBy,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { mockPlans } from "../data/mockData";
import { cn } from "../lib/utils";

interface SharedPlan {
  id: string;
  basePlanId: string;
  title: string;
  creatorId: string;
  createdAt: any;
  inviteCode: string;
}

interface Member {
  userId: string;
  displayName: string;
  photoURL: string;
  progressPercentage?: number;
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  taskId: string;
  createdAt: any;
}

interface Progress {
  completedTaskIds: string[];
}

export default function SharedPlanView() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [user, authLoading] = useAuthState(auth);
  const [plan, setPlan] = useState<SharedPlan | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userProgress, setUserProgress] = useState<Progress>({ completedTaskIds: [] });
  const [activeTab, setActiveTab] = useState<"progress" | "chat">("progress");
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const basePlan = plan ? mockPlans.find(p => p.id === plan.basePlanId) : null;

  useEffect(() => {
    if (!planId || authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch Plan Meta
    const planRef = doc(db, "sharedPlans", planId);
    const unsubPlan = onSnapshot(planRef, (snapshot) => {
      if (snapshot.exists()) {
        setPlan({ id: snapshot.id, ...snapshot.data() } as SharedPlan);
      } else {
        navigate("/plans/shared");
      }
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, `sharedPlans/${planId}`);
    });

    // Fetch Members
    const membersRef = collection(db, "sharedPlans", planId, "members");
    const unsubMembers = onSnapshot(membersRef, (snapshot) => {
      setMembers(snapshot.docs.map(doc => doc.data() as Member));
    });

    // Fetch Comments
    const commentsRef = collection(db, "sharedPlans", planId, "comments");
    const qComments = query(commentsRef, orderBy("createdAt", "asc"));
    const unsubComments = onSnapshot(qComments, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Comment));
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, `sharedPlans/${planId}/comments`);
    });

    return () => {
      unsubPlan();
      unsubMembers();
      unsubComments();
    };
  }, [planId, user, authLoading]);

  // Fetch Current User Progress
  useEffect(() => {
     if (!user || !planId || authLoading) return;
     const progressRef = doc(db, "sharedPlans", planId, "progress", user.uid);
     const unsubProgress = onSnapshot(progressRef, (snapshot) => {
       if (snapshot.exists()) {
         setUserProgress(snapshot.data() as Progress);
       }
     });
     return () => unsubProgress();
  }, [user, planId, authLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleToggleTask = async (taskId: string) => {
    if (!user || !planId) return;

    const isCompleted = userProgress.completedTaskIds.includes(taskId);
    const progressRef = doc(db, "sharedPlans", planId, "progress", user.uid);

    try {
      const newIds = isCompleted 
        ? userProgress.completedTaskIds.filter(id => id !== taskId)
        : [...userProgress.completedTaskIds, taskId];
      
      await setDoc(progressRef, {
        completedTaskIds: newIds,
        lastActiveAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sharedPlans/${planId}/progress`);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !planId || !commentText.trim() || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "sharedPlans", planId, "comments"), {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        text: commentText,
        taskId: "general", // Could be task specific
        createdAt: serverTimestamp()
      });
      setCommentText("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `sharedPlans/${planId}/comments`);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
         <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (!plan || !basePlan) return null;

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col">
       {/* Header */}
       <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate("/plans/shared")}
          className="p-2 hover:bg-white/5 rounded-full transition-colors font-bold"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold truncate">{plan.title}</h1>
          <div className="flex items-center gap-2">
             <div className="flex -space-x-1.5">
                {members.slice(0, 3).map((m, idx) => (
                  <div key={idx} className="w-4 h-4 rounded-full border border-[#1C1F26] bg-white/10 overflow-hidden">
                    {m.photoURL ? <img src={m.photoURL} alt={m.displayName} className="w-full h-full object-cover" /> : <User className="w-full h-full p-0.5" />}
                  </div>
                ))}
             </div>
             <p className="text-[9px] uppercase font-bold tracking-widest text-brand-primary/60">{members.length} Members</p>
          </div>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(plan.inviteCode);
            alert("Invite Code Copied: " + plan.inviteCode);
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-lg text-brand-primary active:scale-95 transition-all"
        >
          <span className="text-[10px] font-black">{plan.inviteCode}</span>
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        <button 
          onClick={() => setActiveTab("progress")}
          className={cn(
            "flex-1 py-4 text-[10px] uppercase font-black tracking-widest transition-all relative",
            activeTab === "progress" ? "text-brand-primary" : "text-white/20"
          )}
        >
          Progress
          {activeTab === "progress" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex-1 py-4 text-[10px] uppercase font-black tracking-widest transition-all relative",
            activeTab === "chat" ? "text-brand-primary" : "text-white/20"
          )}
        >
          Community Chat
          {activeTab === "chat" && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === "progress" ? (
          <div className="p-6 space-y-8 pb-32">
            {/* Friends Progress Summary */}
            <section className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
                 <Users className="w-3.5 h-3.5" /> Team Stats
               </h3>
               <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0">
                          {member.photoURL ? <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5" />}
                       </div>
                       <div className="flex-1 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                             <span className={cn(member.userId === user?.uid ? "text-brand-primary" : "text-white/60")}>
                               {member.userId === user?.uid ? "You" : member.displayName}
                             </span>
                             <span className="text-white/20">40%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-primary/40" style={{ width: "40%" }} />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            {/* Task List */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-white/30 ml-2">Plan Content</h3>
              {basePlan.tasks.map((task: string, idx: number) => {
                 const taskId = `task-${idx}`;
                 const isCompleted = userProgress.completedTaskIds.includes(taskId);
                 return (
                   <button
                    key={taskId}
                    onClick={() => handleToggleTask(taskId)}
                    className={cn(
                      "w-full flex items-center gap-4 p-5 rounded-[28px] border transition-all text-left",
                      isCompleted 
                        ? "bg-brand-primary/5 border-brand-primary/20" 
                        : "bg-[#1C1F26]/60 border-white/5"
                    )}
                   >
                     <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all",
                        isCompleted 
                          ? "bg-brand-primary/20 border-brand-primary/30 text-brand-primary" 
                          : "bg-white/5 border-white/5 text-white/10"
                     )}>
                        {isCompleted ? <Check className="w-5 h-5" strokeWidth={3} /> : <span className="font-black text-xs">{idx + 1}</span>}
                     </div>
                     <div className="flex-1">
                        <h4 className={cn("font-bold text-sm mb-0.5", isCompleted ? "text-brand-primary/80" : "text-white/80")}>{task}</h4>
                     </div>
                     <ChevronRight className="w-4 h-4 text-white/10" />
                   </button>
                 );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-[#121418]">
             <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar pb-32">
                {comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4">
                       <MessageSquare className="w-8 h-8 text-white/10" />
                    </div>
                    <p className="text-white/30 text-sm italic">No messages yet. Start a conversation with your community!</p>
                  </div>
                ) : (
                  comments.map((comment, i) => {
                    const isMe = comment.userId === user?.uid;
                    return (
                      <div key={comment.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[80%] rounded-[24px] p-4 text-sm leading-relaxed",
                          isMe 
                            ? "bg-brand-primary text-white rounded-tr-none" 
                            : "bg-white/5 text-white/80 border border-white/5 rounded-tl-none"
                        )}>
                          {comment.text}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 px-2">
                           {!isMe && <span className="text-[8px] font-black uppercase tracking-widest text-white/30">{comment.userName}</span>}
                           <span className="text-[8px] font-bold text-white/10">{comment.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
             </div>

             <div className="sticky bottom-0 p-6 bg-[#121418]/80 backdrop-blur-xl border-t border-white/5">
                <form 
                  onSubmit={handlePostComment}
                  className="relative group"
                >
                  <input 
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Message the community..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-brand-primary/30 transition-all"
                  />
                  <button 
                    disabled={!commentText.trim() || isSending}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-primary text-white rounded-xl flex items-center justify-center active:scale-90 disabled:opacity-50 transition-all"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
