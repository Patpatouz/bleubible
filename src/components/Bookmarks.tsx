import { useState, useEffect, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bookmark, 
  Trash2, 
  ChevronRight, 
  Calendar, 
  BookOpen,
  ArrowLeft,
  Loader2,
  X,
  History,
  Copy,
  Check,
  Search
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { bookmarkService } from "../services/bookmarkService";
import { Bookmark as BookmarkType } from "../types";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Bookmarks() {
  const [user, authLoading, authError] = useAuthState(auth);
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setLocalError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'verse' | 'chapter'>('all');

  useEffect(() => {
    // Timeout to prevent infinite loading if Firebase hangs
    const timer = setTimeout(() => {
      if (loading) setLoading(false);
    }, 8000);

    if (authLoading) return;
    
    if (authError) {
      setLocalError("Authentication error. Please try again.");
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      setBookmarks([]);
      return;
    }
    loadBookmarks();

    return () => clearTimeout(timer);
  }, [user, authLoading, authError]);

  const loadBookmarks = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const data = await bookmarkService.getBookmarks();
      setBookmarks(data);
    } catch (err) {
      console.error(err);
      setLocalError("Failed to load bookmarks. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBookmarks = bookmarks.filter(b => {
    const matchesSearch = b.reference.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (b.text?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || b.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleDelete = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    try {
      await bookmarkService.removeBookmark(id);
      setBookmarks(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (bookmark: BookmarkType, e: MouseEvent) => {
    e.stopPropagation();
    if (!bookmark.text) return;
    navigator.clipboard.writeText(`${bookmark.text} (${bookmark.reference})`);
    setCopiedId(bookmark.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navigateToChapter = (bookmark: BookmarkType) => {
    navigate("/bible", { 
      state: { 
        bookId: bookmark.bookId,
        chapter: bookmark.chapterNum,
        bookName: bookmark.reference.split(' ').slice(0, -1).join(' '),
        verse: bookmark.verseNum
      } 
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-bg p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-[40px] flex items-center justify-center mb-6">
          <X className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-white/40 text-sm max-w-xs mb-8">{error}</p>
        <button 
          onClick={loadBookmarks}
          className="bg-brand-primary text-white font-bold px-8 py-3 rounded-2xl shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 pb-32 max-w-2xl mx-auto"
    >
      <header className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
          <p className="text-white/40 text-sm">Your saved verses and chapters</p>
        </div>
      </header>

      {/* Search and Filters */}
      <div className="space-y-6 mb-8">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-brand-primary transition-colors" />
          <input 
            type="text"
            placeholder="Search in bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-primary/40 focus:bg-white/[0.05] transition-all text-sm font-medium"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {(['all', 'verse', 'chapter'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border",
                filterType === type 
                  ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20" 
                  : "bg-white/[0.03] text-white/40 border-white/5 hover:bg-white/10"
              )}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredBookmarks.length > 0 ?
          filteredBookmarks.map((bookmark) => (
            <motion.div
              layout
              key={bookmark.id}
              onClick={() => navigateToChapter(bookmark)}
              className="bg-[#1C1F26]/50 border border-white/5 p-6 rounded-[32px] cursor-pointer hover:bg-white/[0.03] transition-all group active:scale-[0.99]"
            >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                  bookmark.type === 'verse' ? "bg-brand-primary/10 text-brand-primary" : "bg-purple-500/10 text-purple-400"
                )}>
                  {bookmark.type === 'verse' ? <Bookmark className="w-5 h-5 fill-current" /> : <BookOpen className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight flex items-baseline gap-1">
                    {bookmark.reference.split(':').length > 1 ? (
                      <>
                        {bookmark.reference.split(':')[0]}:
                        <span className="text-xl font-black text-brand-primary">{bookmark.reference.split(':')[1]}</span>
                      </>
                    ) : bookmark.reference}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase font-black tracking-widest mt-1">
                    <Calendar className="w-3 h-3" />
                    {bookmark.createdAt instanceof Object && 'seconds' in bookmark.createdAt 
                      ? new Date(bookmark.createdAt.seconds * 1000).toLocaleDateString() 
                      : 'Recently saved'}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {bookmark.text && (
                  <button 
                    onClick={(e) => handleCopy(bookmark, e)}
                    className="p-2 text-white/10 hover:text-white transition-colors"
                  >
                    {copiedId === bookmark.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button 
                  onClick={(e) => handleDelete(bookmark.id, e)}
                  className="p-2 text-white/10 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {bookmark.text && (
              <p className="text-white/60 text-sm italic font-serif leading-relaxed line-clamp-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                "{bookmark.text}"
              </p>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                bookmark.type === 'verse' ? "text-brand-primary bg-brand-primary/10" : "text-purple-400 bg-purple-500/10"
              )}>
                {bookmark.type}
              </span>
              <div className="flex items-center gap-1.5 text-white/20 text-[10px] font-bold uppercase tracking-widest group-hover:text-brand-primary transition-colors">
                <span>Go to Reader</span>
                <ChevronRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))
        : searchQuery ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-white/[0.02] border border-white/5 rounded-3xl flex items-center justify-center mb-6">
              <Search className="w-8 h-8 text-white/10" />
            </div>
            <h3 className="text-xl font-bold mb-2">No matching bookmarks</h3>
            <p className="text-white/30 text-sm max-w-xs mx-auto">
              Try a different keyword or filter.
            </p>
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-xl font-bold mb-2">No bookmarks yet</h3>
            <p className="text-white/30 text-sm max-w-xs mx-auto">
              Save your favorite verses and chapters while reading the Bible to find them quickly later.
            </p>
            <button 
              onClick={() => navigate("/bible")}
              className="mt-8 bg-brand-primary text-white font-bold px-8 py-3 rounded-2xl shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
            >
              Start Reading
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
