import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Send, 
  User, 
  Clock, 
  Plus, 
  X, 
  MessageCircle, 
  Sparkles,
  Loader2,
  ChevronLeft,
  Search,
  Filter,
  CheckCircle2,
  TrendingUp,
  Share2
} from "lucide-react";
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from "../lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  increment,
  setDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { cn } from "../lib/utils";

interface PrayerRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
  prayedCount: number;
}

export default function PrayerWall() {
  const [user, authLoading] = useAuthState(auth);
  const navigate = useNavigate();
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPrayer, setNewPrayer] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "trending" | "my">("all");
  const [showAmenEffect, setShowAmenEffect] = useState<string | null>(null);

  useEffect(() => {
    // We allow public listing now, but let's wait for auth to settle to be clean
    if (authLoading) return;
    const q = query(
      collection(db, "prayers"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PrayerRequest[];
      setPrayers(docs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, "prayers");
    });

    return () => unsubscribe();
  }, [authLoading]);

  const filteredPrayers = prayers.filter(p => {
    const matchesSearch = p.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.userName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "trending") return matchesSearch && p.prayedCount >= 10;
    if (activeFilter === "my") return matchesSearch && p.userId === user?.uid;
    return matchesSearch;
  });

  const handlePostPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await signInWithGoogle();
      return;
    }
    if (!newPrayer.trim() || isPosting) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, "prayers"), {
        userId: user.uid,
        userName: user.displayName || "Anonymous User",
        userPhoto: user.photoURL || "",
        text: newPrayer,
        createdAt: serverTimestamp(),
        prayedCount: 0
      });
      setNewPrayer("");
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "prayers");
    } finally {
      setIsPosting(false);
    }
  };

  const handlePray = async (prayerId: string) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }

    try {
      // 1. Add to subcollection to track WHO prayed (relational integrity)
      const prayDocRef = doc(db, "prayers", prayerId, "prays", user.uid);
      await setDoc(prayDocRef, {
        userId: user.uid,
        userName: user.displayName,
        userPhoto: user.photoURL,
        createdAt: serverTimestamp()
      });

      // 2. Increment the main document counter
      const prayerDocRef = doc(db, "prayers", prayerId);
      await updateDoc(prayerDocRef, {
        prayedCount: increment(1)
      });

      // Show effect
      setShowAmenEffect(prayerId);
      setTimeout(() => setShowAmenEffect(null), 1000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `prayers/${prayerId}`);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate("/")}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Prayer Community</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40">
              {prayers.reduce((acc, curr) => acc + curr.prayedCount, 0) + 124} Studying & Praying Now
            </p>
          </div>
        </div>
        <button 
          onClick={() => user ? setShowForm(true) : signInWithGoogle()}
          className="px-4 py-2 bg-brand-primary rounded-xl flex items-center gap-2 shadow-lg shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all text-xs font-bold text-white"
        >
          <Plus className="w-4 h-4" />
          <span>Request</span>
        </button>
      </header>

      <div className="max-w-xl mx-auto p-6 space-y-6">
        {/* Search & Filter */}
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
            <input 
              type="text"
              placeholder="Search prayers or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-primary/30 focus:bg-white/10 transition-all font-medium placeholder:text-white/20"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "all", label: "All Feed", icon: MessageCircle },
              { id: "trending", label: "Urgent", icon: TrendingUp },
              { id: "my", label: "My Requests", icon: User },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                  activeFilter === filter.id 
                    ? "bg-brand-primary/10 border-brand-primary/40 text-brand-primary shadow-lg shadow-brand-primary/5" 
                    : "bg-white/5 border-white/5 text-white/30 hover:bg-white/10"
                )}
              >
                <filter.icon className="w-3.5 h-3.5" />
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-primary/40" />
            <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Loading Prayers...</p>
          </div>
        ) : filteredPrayers.length === 0 ? (
          <div className="text-center py-20 px-8 border-2 border-dashed border-white/5 rounded-[40px] space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="font-bold text-lg">{searchQuery ? "No matching prayers" : "No prayer requests yet"}</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              {searchQuery ? "Try a different search term or explore all prayers." : "Be the first to share what's on your heart. Our community is here to stand with you."}
            </p>
            {!searchQuery && (
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-3 bg-brand-primary rounded-2xl text-xs font-bold uppercase tracking-widest text-white hover:bg-brand-primary/90 transition-all"
              >
                Post a Prayer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrayers.map((prayer, i) => (
              <motion.article 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={prayer.id}
                className="bg-[#1C1F26]/40 border border-white/5 rounded-[32px] p-6 space-y-4 hover:border-brand-primary/20 transition-all group relative overflow-hidden"
              >
                {/* Amen Effect Overlay */}
                <AnimatePresence>
                  {showAmenEffect === prayer.id && (
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [0.5, 1.5, 2], opacity: [0, 1, 0] }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                    >
                      <Heart className="w-24 h-24 text-brand-primary fill-brand-primary shadow-xl" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                      {prayer.userPhoto ? (
                        <img src={prayer.userPhoto} alt={prayer.userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-white/90">{prayer.userName}</p>
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        <Clock className="w-3 h-3" />
                        {prayer.createdAt?.toDate().toLocaleDateString() || "Just now"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/5 rounded-lg text-white/20 hover:text-white/60 transition-colors">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    {prayer.prayedCount >= 10 && (
                      <div className="bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-brand-primary/20 animate-pulse">
                        Urgent
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 relative overflow-hidden group-hover:bg-white/[0.04] transition-colors">
                  <p className="text-base text-white/80 leading-loose font-serif italic relative z-10">
                    "{prayer.text}"
                  </p>
                  <Sparkles className="absolute -bottom-4 -right-4 w-16 h-16 text-brand-primary opacity-5" />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((_, idx) => (
                        <div key={idx} className="w-7 h-7 rounded-full border-2 border-[#1C1F26] bg-white/5 flex items-center justify-center overflow-hidden">
                           <div className="w-full h-full bg-gradient-to-br from-brand-primary/20 to-transparent flex items-center justify-center">
                             <User className="w-3 h-3 text-white/20" />
                           </div>
                        </div>
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-brand-primary/40 transition-colors">
                      {prayer.prayedCount > 0 ? `${prayer.prayedCount} People Prayed` : "Waiting for Prayer"}
                    </span>
                  </div>

                  <button 
                    onClick={() => handlePray(prayer.id)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all active:scale-95 group-hover:shadow-[0_10px_20px_-10px_rgba(245,158,11,0.2)]",
                      "bg-brand-primary text-white font-bold text-xs uppercase tracking-widest"
                    )}
                  >
                    <Heart className="w-4 h-4 fill-white animate-pulse" />
                    <span>Amen</span>
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#1C1F26] border border-white/10 rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-brand-primary/5">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-brand-primary" />
                   </div>
                   <div>
                     <h2 className="text-xl font-bold">New Prayer</h2>
                     <p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/60">Share with community</p>
                   </div>
                </div>
                <button 
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white/20" />
                </button>
              </div>

              <form onSubmit={handlePostPrayer} className="p-8 space-y-6">
                <div className="space-y-4">
                   <label className="text-[10px] uppercase font-black tracking-widest text-white/30 ml-2">What's on your heart?</label>
                   <textarea 
                    value={newPrayer}
                    onChange={(e) => setNewPrayer(e.target.value)}
                    placeholder="Enter your prayer request..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm min-h-[160px] focus:outline-none focus:border-brand-primary/30 transition-all font-serif italic"
                    maxLength={2000}
                   />
                </div>

                <button 
                  type="submit"
                  disabled={!newPrayer.trim() || isPosting}
                  className="w-full py-5 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isPosting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  <span>{isPosting ? "Posting..." : "Share Prayer"}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
