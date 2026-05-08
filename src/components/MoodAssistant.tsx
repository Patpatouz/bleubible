import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  X,
  Quote,
  BookOpen,
  ChevronLeft,
  MessageSquare,
  ChevronRight,
  Sun,
  RefreshCw
} from "lucide-react";
import { geminiService, RecommendationResponse } from "../services/geminiService";
import { parseBibleReference, findBook } from "../lib/bibleUtils";
import { BibleLinker } from "./BibleLinker";
import { cn } from "../lib/utils";

export default function MoodAssistant() {
  const navigate = useNavigate();
  const [moodInput, setMoodInput] = useState("");
  const [moodResult, setMoodResult] = useState<RecommendationResponse | null>(() => {
    const saved = localStorage.getItem("mood-result");
    return saved ? JSON.parse(saved) : null;
  });
  const [isMoodLoading, setIsMoodLoading] = useState(false);
  const [featuredVerseIndex, setFeaturedVerseIndex] = useState(0);

  const handleMoodAssistant = async () => {
    if (!moodInput.trim()) return;
    setIsMoodLoading(true);
    setMoodResult(null);
    setFeaturedVerseIndex(0);
    try {
      const result = await geminiService.getMoodRecommendations(moodInput);
      setMoodResult(result);
      localStorage.setItem("mood-result", JSON.stringify(result));
    } catch (error) {
      console.error("Mood Assistant Error:", error);
    } finally {
      setIsMoodLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-dark-bg text-[#E2E8F0]"
    >
      <header className="sticky top-0 z-40 bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Spiritual Assistant</h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/60">AI Guidance</p>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {!moodResult && !isMoodLoading ? (
          <div className="space-y-8 mt-4">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-primary/5">
              <Sparkles className="w-10 h-10 text-brand-primary" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">How are you feeling?</h2>
              <p className="text-white/40 text-sm">Be honest. Whether you're anxious, joyful, or weary, I'll find Scripture that speaks directly to your heart.</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <MessageSquare className="absolute left-6 top-6 w-5 h-5 text-white/20 group-focus-within:text-brand-primary transition-colors" />
                <textarea
                  placeholder="I'm feeling a bit overwhelmed by work and need some peace..."
                  className="w-full bg-[#1C1F26]/50 border border-white/10 rounded-[32px] pt-16 p-6 text-sm focus:outline-none focus:border-brand-primary/30 transition-all min-h-[220px] resize-none font-medium placeholder:text-white/20"
                  value={moodInput}
                  onChange={(e) => setMoodInput(e.target.value)}
                />
              </div>
              <button
                onClick={handleMoodAssistant}
                className="w-full py-5 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-brand-primary/20 text-sm uppercase tracking-widest"
              >
                Find Wisdom
              </button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {['Anxious', 'Grateful', 'Weary', 'Joyful', 'Lost', 'Peaceful'].map((mood) => (
                <button
                  key={mood}
                  onClick={() => setMoodInput(mood)}
                  className="px-5 py-2.5 bg-white/5 border border-white/5 rounded-full text-xs font-bold text-white/40 hover:text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all"
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>
        ) : isMoodLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-brand-primary opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-brand-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white/90">Searching the Scriptures...</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/60 mt-2">Personalizing your experience</p>
            </div>
          </div>
        ) : (
          moodResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 py-4"
            >
              <div className="bg-[#1C1F26]/40 border border-white/5 rounded-[32px] p-8 shadow-xl">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-primary/60 mb-4 px-1">Reflection</h3>
                 <BibleLinker 
                    text={moodResult.explanation}
                    className="text-white/80 text-lg leading-relaxed italic font-serif"
                    onNavigate={(book, chapter, verse) => {
                      const bookObj = findBook(book);
                      navigate("/bible", { state: { bookName: bookObj?.id || book, chapter, verse } });
                    }}
                  />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-white/20 px-4">Bible Verse Selections</p>
                <div className="grid gap-3">
                  {moodResult.verses.map((v, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-4 p-5 border rounded-[32px] transition-all text-left group relative",
                        i === featuredVerseIndex 
                          ? "bg-brand-primary/10 border-brand-primary/30" 
                          : "bg-white/5 border-white/5 hover:bg-white/10"
                      )}
                    >
                      <button
                        onClick={() => setFeaturedVerseIndex(i)}
                        className="flex-1 flex items-start gap-4 text-left"
                      >
                        <div className="text-brand-primary/40 font-black text-xs mt-1 shrink-0">0{i+1}</div>
                        <div className="flex-1">
                          <p className="font-bold text-base group-hover:text-brand-primary transition-colors">{v.reference}</p>
                          <p className="text-sm text-white/40 leading-relaxed italic mt-1">"{v.text}"</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          const ref = parseBibleReference(v.reference);
                          if (ref) {
                            navigate("/bible", { state: ref });
                          }
                        }}
                        className="w-12 h-12 bg-white/10 text-white/40 rounded-2xl flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all active:scale-90"
                      >
                        <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-6">
                {moodResult.readingPlanId && (
                    <button 
                      onClick={() => navigate(`/plans/${moodResult.readingPlanId}`)}
                      className="w-full py-5 bg-brand-primary text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-brand-primary/90 transition-colors shadow-lg shadow-brand-primary/20"
                    >
                      Start Reading Plan
                    </button>
                )}
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      setMoodResult(null);
                      setMoodInput("");
                      localStorage.removeItem("mood-result");
                    }}
                    className="flex-1 py-4 flex items-center justify-center gap-2 bg-white/5 border border-white/5 rounded-2xl text-white/40 hover:text-white hover:bg-white/10 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    <RefreshCw className="w-4 h-4" /> Start Over
                  </button>
                  <button 
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 py-4 bg-white/5 text-white/60 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Finish
                  </button>
                </div>
              </div>
            </motion.div>
          )
        )}
      </main>
    </motion.div>
  );
}
