import { useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Loader2,
  X,
  Quote,
  BookOpen,
  ChevronLeft
} from "lucide-react";
import { geminiService, PrayerResponse } from "../services/geminiService";
import { parseBibleReference } from "../lib/bibleUtils";

export default function PrayerAssistant() {
  const navigate = useNavigate();
  const [prayerTopic, setPrayerTopic] = useState("");
  const [prayerResult, setPrayerResult] = useState<PrayerResponse | null>(null);
  const [isPrayerLoading, setIsPrayerLoading] = useState(false);

  const handleGeneratePrayer = async () => {
    setIsPrayerLoading(true);
    setPrayerResult(null);
    try {
      const result = await geminiService.generatePrayer(prayerTopic || undefined);
      setPrayerResult(result);
    } catch (error) {
      console.error("Prayer Assistant Error:", error);
    } finally {
      setIsPrayerLoading(false);
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
          <h1 className="text-xl font-bold">AI Prayer Assistant</h1>
          <p className="text-[10px] uppercase font-black tracking-widest text-brand-primary/60">Personal Guidance</p>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {!prayerResult && !isPrayerLoading ? (
          <div className="space-y-8 mt-4">
            <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-brand-primary/5">
              <Sparkles className="w-10 h-10 text-brand-primary" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">How can I pray for you?</h2>
              <p className="text-white/40 text-sm">Enter a topic, a worry, or a word of gratitude. I'll craft a personalized prayer rooted in Scripture.</p>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <textarea
                  placeholder="E.g. Peace during exam week, strength for a friend, gratitude for family..."
                  className="w-full bg-[#1C1F26]/50 border border-white/10 rounded-[32px] p-6 text-sm focus:outline-none focus:border-brand-primary/30 transition-all min-h-[160px] resize-none font-medium placeholder:text-white/20"
                  value={prayerTopic}
                  onChange={(e) => setPrayerTopic(e.target.value)}
                />
              </div>
              <button
                onClick={handleGeneratePrayer}
                className="w-full py-5 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-brand-primary/20 text-sm uppercase tracking-widest"
              >
                Generate Prayer
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-8">
              {['Strength', 'Peace', 'Gratitude', 'Healing'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setPrayerTopic(tag)}
                  className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs font-bold text-white/40 hover:text-brand-primary hover:bg-brand-primary/5 hover:border-brand-primary/20 transition-all"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ) : isPrayerLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-brand-primary opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-brand-primary animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-white/90">Crafting your prayer...</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/60 mt-2">Connecting with the Word</p>
            </div>
          </div>
        ) : (
          prayerResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 py-4"
            >
              <div className="text-center space-y-2">
                <h3 className="text-3xl font-serif italic text-white/90 leading-tight">{prayerResult.title}</h3>
                <div className="w-16 h-1 bg-brand-primary/30 mx-auto rounded-full" />
              </div>

              <div className="bg-[#1C1F26]/30 border border-white/5 rounded-[40px] p-8 font-serif italic text-white/80 leading-loose text-xl text-center relative shadow-2xl">
                <Quote className="absolute top-6 left-6 w-10 h-10 text-brand-primary/10" strokeWidth={1} />
                {prayerResult.prayer}
                <Quote className="absolute bottom-6 right-6 w-10 h-10 text-brand-primary/10 rotate-180" strokeWidth={1} />
              </div>

              <div className="space-y-4">
                <p className="text-[10px] uppercase font-black tracking-widest text-white/20 text-center">Rooted in Scripture</p>
                <div className="grid gap-4">
                  {prayerResult.verses.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const ref = parseBibleReference(v.reference);
                        if (ref) {
                          navigate("/bible", { state: ref });
                        }
                      }}
                      className="bg-white/[0.03] border border-white/5 rounded-[28px] p-6 text-left hover:bg-white/5 hover:border-brand-primary/20 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-base text-brand-primary/80 group-hover:text-brand-primary transition-colors">{v.reference}</p>
                        <BookOpen className="w-4 h-4 text-white/10 group-hover:text-brand-primary transition-colors" />
                      </div>
                      <p className="text-sm text-white/40 leading-relaxed italic group-hover:text-white/60 transition-colors">"{v.text}"</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setPrayerResult(null)}
                  className="flex-1 py-5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/5 transition-all"
                >
                  Generate Another
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 py-5 bg-white/5 text-white/60 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Finish
                </button>
              </div>
            </motion.div>
          )
        )}
      </main>
    </motion.div>
  );
}
