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
  Check
} from "lucide-react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { bookmarkService } from "../services/bookmarkService";
import { Bookmark as BookmarkType } from "../types";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function Bookmarks() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadBookmarks();
  }, [user]);

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const data = await bookmarkService.getBookmarks();
      setBookmarks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
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
        ))}

        {bookmarks.length === 0 && (
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
