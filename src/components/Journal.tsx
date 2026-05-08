import { useState, useEffect, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Search, 
  Bookmark, 
  Trash2, 
  ChevronRight, 
  Calendar, 
  Quote, 
  Sparkles, 
  BookOpen,
  ArrowLeft,
  Loader2,
  X
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { journalService } from "../services/journalService";
import { JournalEntry } from "../types";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export default function Journal() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await journalService.getJournalEntries();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await journalService.createEntry({
        title: newTitle || "Untitled Entry",
        content: newContent,
      });
      setIsCreating(false);
      setNewTitle("");
      setNewContent("");
      loadEntries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      await journalService.deleteEntry(id);
      loadEntries();
      if (selectedEntry?.id === id) setSelectedEntry(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 pb-32 max-w-2xl mx-auto"
    >
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journal</h1>
          <p className="text-white/40 text-sm">Document your spiritual journey</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/20 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
        <input 
          type="text"
          placeholder="Search entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#1C1F26] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:border-brand-primary/50 transition-colors"
        />
      </div>

      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <motion.div
            layout
            key={entry.id}
            onClick={() => setSelectedEntry(entry)}
            className="bg-[#1C1F26]/50 border border-white/5 p-6 rounded-[32px] cursor-pointer hover:bg-white/[0.03] transition-all group active:scale-[0.99]"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-brand-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{entry.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase font-black tracking-widest mt-1">
                    <Calendar className="w-3 h-3" />
                    {entry.createdAt instanceof Object ? new Date(entry.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => handleDelete(entry.id, e)}
                className="p-2 text-white/10 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-white/60 text-sm line-clamp-2 leading-relaxed">
              {entry.content}
            </p>

            {entry.pinnedVerses && entry.pinnedVerses.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {entry.pinnedVerses.slice(0, 2).map((v, i) => (
                  <span key={i} className="text-[10px] bg-brand-primary/10 text-brand-primary px-2 py-1 rounded-lg border border-brand-primary/10">
                    {v.reference}
                  </span>
                ))}
                {entry.pinnedVerses.length > 2 && (
                  <span className="text-[10px] text-white/20">+{entry.pinnedVerses.length - 2} more</span>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {filteredEntries.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6">
              <Quote className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-bold mb-2">No entries found</h3>
            <p className="text-white/30 text-sm max-w-xs mx-auto">
              Start documenting your thoughts, prayers, and reflections today.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-[100] bg-dark-bg flex flex-col pt-safe no-scrollbar overflow-y-auto"
          >
            <div className="p-6 flex flex-col h-full max-w-2xl mx-auto w-full">
              <header className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                  <h2 className="font-bold text-lg">{selectedEntry.title}</h2>
                  <p className="text-[10px] text-white/20 uppercase font-black tracking-widest leading-tight">
                    {selectedEntry.createdAt instanceof Object ? new Date(selectedEntry.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                <button 
                  onClick={(e) => handleDelete(selectedEntry.id, e)}
                  className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </header>

              <div className="space-y-8 flex-1">
                {selectedEntry.prompt && (
                  <div className="bg-brand-primary/5 border border-brand-primary/10 p-6 rounded-[32px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3 h-3 text-brand-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Weekly Reflection Prompt</span>
                    </div>
                    <p className="text-white/80 font-medium italic">"{selectedEntry.prompt}"</p>
                  </div>
                )}

                <div className="prose prose-invert max-w-none">
                  <p className="text-lg leading-relaxed text-white/70 whitespace-pre-wrap">
                    {selectedEntry.content}
                  </p>
                </div>

                {selectedEntry.pinnedVerses && selectedEntry.pinnedVerses.length > 0 && (
                  <section className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/20 flex items-center gap-2">
                       <BookOpen className="w-3 h-3" /> Pinned Verses
                    </h4>
                    <div className="space-y-3">
                      {selectedEntry.pinnedVerses.map((v, i) => (
                        <div 
                          key={i}
                          className="bg-white/5 border border-white/5 rounded-3xl p-5 hover:bg-white/10 transition-colors group cursor-pointer"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-brand-primary">{v.reference}</span>
                            <ArrowLeft className="w-4 h-4 text-white/10 group-hover:text-brand-primary/40 rotate-180 transition-colors" />
                          </div>
                          <p className="text-sm text-white/60 font-serif leading-relaxed italic">"{v.text}"</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
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
                    <Plus className="w-6 h-6 text-brand-primary" />
                   </div>
                   <button 
                     onClick={() => setIsCreating(false)}
                     className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors"
                   >
                     <X className="w-5 h-5" />
                   </button>
                 </div>
                 
                 <h3 className="text-2xl font-bold mb-6">New Entry</h3>
                 
                 <div className="space-y-4 mb-8">
                   <input 
                     type="text"
                     placeholder="Title"
                     value={newTitle}
                     onChange={(e) => setNewTitle(e.target.value)}
                     className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:border-brand-primary/50 transition-colors"
                   />
                   <textarea
                     placeholder="Your thoughts..."
                     value={newContent}
                     onChange={(e) => setNewContent(e.target.value)}
                     className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm focus:border-brand-primary/50 transition-colors min-h-[200px] resize-none"
                   />
                 </div>
                 
                 <button 
                  onClick={handleCreate}
                  disabled={!newContent.trim()}
                  className="w-full bg-brand-primary text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  Create Entry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
