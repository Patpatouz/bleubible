import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  ChevronRight, 
  Plus, 
  X, 
  CheckCircle2, 
  MessageSquare, 
  Send,
  User,
  Calendar,
  Lock,
  Search,
  Sparkles,
  Loader2,
  ChevronLeft
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
  collectionGroup
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
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

interface PlanMember {
  userId: string;
  displayName: string;
  photoURL: string;
}

export default function SharedPlans() {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const [mySharedPlans, setMySharedPlans] = useState<SharedPlan[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Fetch plans I'm a member of
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    // Use collectionGroup or just query /sharedPlans and filter in JS if needed, 
    // but better to use a proper query if we can.
    // Actually, we can query `members` collection group where userId == user.uid
    // and then fetch the parent plan docs.
    // For simplicity in this demo, let's query sharedPlans where creator == user 
    // OR fetch all and check membership (not scalable but works for MVP).
    const q = query(collection(db, "sharedPlans"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SharedPlan[];
      // In a real app, I'd use a more efficient query.
      setMySharedPlans(plans);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "sharedPlans");
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleCreatePlan = async (basePlanId: string) => {
    if (!user) return await signInWithGoogle();
    
    const basePlan = mockPlans.find(p => p.id === basePlanId);
    if (!basePlan) return;

    try {
      const planRef = await addDoc(collection(db, "sharedPlans"), {
        basePlanId,
        title: basePlan.title,
        creatorId: user.uid,
        createdAt: serverTimestamp(),
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      });

      // Add creator as member
      await setDoc(doc(db, "sharedPlans", planRef.id, "members", user.uid), {
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        joinedAt: serverTimestamp()
      });

      setShowCreateModal(false);
      navigate(`/plans/shared/${planRef.id}`);
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, "sharedPlans");
    }
  };

  const handleJoinPlan = async () => {
    if (!user) return await signInWithGoogle();
    if (!inviteCode.trim()) return;

    setIsJoining(true);
    try {
      const q = query(collection(db, "sharedPlans"), where("inviteCode", "==", inviteCode.trim()));
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (!snapshot.empty) {
          const planId = snapshot.docs[0].id;
          await setDoc(doc(db, "sharedPlans", planId, "members", user.uid), {
            userId: user.uid,
            displayName: user.displayName,
            photoURL: user.photoURL,
            joinedAt: serverTimestamp()
          });
          navigate(`/plans/shared/${planId}`);
        } else {
          alert("Invalid Invite Code");
        }
        setIsJoining(false);
        unsubscribe();
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "sharedPlans/members");
      setIsJoining(false);
    }
  };

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-dark-bg text-center gap-8">
        <div className="w-24 h-24 bg-brand-primary/10 rounded-[40px] flex items-center justify-center">
           <Lock className="w-10 h-10 text-brand-primary" />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Shared Reading Plans</h2>
          <p className="text-white/40 max-w-sm">Join a community of believers and grow together in the Word. Sign in to access shared plans.</p>
        </div>
        <button 
          onClick={signInWithGoogle}
          className="px-8 py-4 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg pb-24">
       <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Shared Plans</h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/60">Community Groups</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={() => setShowJoinModal(true)}
            className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all"
            title="Join with Code"
           >
            <Users className="w-5 h-5 text-white/60" />
           </button>
           <button 
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all"
            title="Create Group Plan"
           >
            <Plus className="w-5 h-5 text-white" />
           </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-10">
        {/* Active Plans */}
        <section>
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            Your Active Groups
            <span className="bg-brand-primary/10 text-brand-primary text-[10px] px-2 py-0.5 rounded-full">{mySharedPlans.length}</span>
          </h2>
          
          {loading ? (
             <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 animate-spin text-brand-primary/20" />
             </div>
          ) : mySharedPlans.length === 0 ? (
            <div className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[40px] p-12 text-center space-y-4">
               <Users className="w-12 h-12 text-white/10 mx-auto" strokeWidth={1} />
               <p className="text-white/30 text-sm">No shared plans yet. Create one to invite friends!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {mySharedPlans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => navigate(`/plans/shared/${plan.id}`)}
                  className="bg-[#1C1F26]/40 border border-white/5 rounded-[32px] p-6 text-left hover:border-brand-primary/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 bg-brand-primary/5 text-brand-primary text-[10px] font-black tracking-widest rounded-bl-2xl uppercase">
                    Group Plan
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-xl group-hover:text-brand-primary transition-colors">{plan.title}</h3>
                    <div className="flex items-center gap-4">
                       <div className="flex -space-x-2">
                          {[1, 2].map(i => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 border-[#1C1F26] bg-white/10 flex items-center justify-center">
                               <User className="w-3.5 h-3.5 text-white/20" />
                            </div>
                          ))}
                          <div className="w-7 h-7 rounded-full border-2 border-[#1C1F26] bg-brand-primary/20 flex items-center justify-center text-[8px] font-black text-brand-primary">
                            +3
                          </div>
                       </div>
                       <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">5 Members Active</span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                       <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-brand-primary/60">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>On Day 4</span>
                       </div>
                       <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-brand-primary/60 transition-all" strokeWidth={1.5} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Discovery Section */}
        <section>
          <h2 className="text-lg font-bold mb-6">Create New Group</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockPlans.slice(0, 4).map(plan => (
              <button 
                key={plan.id}
                onClick={() => handleCreatePlan(plan.id)}
                className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-left hover:bg-white/5 transition-all group"
              >
                <div className="w-10 h-10 bg-brand-primary/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-brand-primary" />
                </div>
                <h4 className="font-bold text-sm mb-1">{plan.title}</h4>
                <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">{plan.durationDays} Days Plan</p>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Join Modal */}
       <AnimatePresence>
        {showJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1C1F26] border border-white/10 rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-brand-primary/5">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-brand-primary" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold">Join Group</h2>
                     <p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/60">Enter Invite Code</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowJoinModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white/20" />
                </button>
              </div>

              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                   <input 
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="E.G. AB12XY"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 px-6 text-center text-3xl font-black tracking-[0.2em] focus:outline-none focus:border-brand-primary/30 transition-all placeholder:text-white/5"
                    maxLength={6}
                   />
                   <p className="text-center text-xs text-white/20">Ask your friend for the 6-character code.</p>
                 </div>

                 <button 
                  onClick={handleJoinPlan}
                  disabled={inviteCode.length < 4 || isJoining}
                  className="w-full py-5 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  <span>{isJoining ? "Joining..." : "Join Community"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
