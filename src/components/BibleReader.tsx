import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Search,
  ChevronRight,
  Loader2,
  X,
  BookOpen,
  Volume2,
  Square,
  Play,
  Pause,
  Type,
  History,
  Headphones,
  StickyNote,
  Bell,
  Sparkles,
  Cloud,
  Library,
  Lightbulb,
  BookOpenText,
  PanelLeftClose,
  PanelRightClose,
  ArrowUpRight,
  Bookmark,
  Quote
} from "lucide-react";
import { geminiService, ExplanationResponse, StudyAidResponse } from "../services/geminiService";
import { fetchChapter, searchBible } from "../services/bibleService";
import { BIBLE_BOOKS, BibleBook } from "../data/bibleBooks";
import { Chapter } from "../types";
import { cn } from "../lib/utils";
import { BibleLinker } from "./BibleLinker";
import { findBook, parseBibleReference } from "../lib/bibleUtils";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { bookmarkService } from "../services/bookmarkService";
import { doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  useState,
  useEffect,
  FormEvent,
  MouseEvent,
  useRef,
  TouchEvent,
} from "react";

const BIBLE_VERSIONS = [
  { id: "kjv", name: "King James Version", abbrev: "KJV" },
  { id: "web", name: "World English Bible", abbrev: "WEB" },
  { id: "bbe", name: "Bible in Basic English", abbrev: "BBE" },
  { id: "oeb-us", name: "Open English Bible", abbrev: "OEB" },
];

export interface HistoryItem {
  id: string;
  bookId: string;
  bookName: string;
  chapterNum: number;
  verseNum?: number;
  translation: string;
  timestamp: number;
}

export default function BibleReader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [isSyncing, setIsSyncing] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentBook, setCurrentBook] = useState<BibleBook>(() => {
    // Priority 1: Location state
    if (location.state?.bookName) {
      const book = findBook(location.state.bookName);
      if (book) return book;
    }

    // Priority 2: Local storage
    const lastId = localStorage.getItem("bible-last-book");
    if (lastId) {
      const book = BIBLE_BOOKS.find((b) => b.id === lastId);
      if (book) return book;
    }

    // Default
    return BIBLE_BOOKS.find((b) => b.id === "john") || BIBLE_BOOKS[0];
  });

  const [currentChapterNum, setCurrentChapterNum] = useState(() => {
    if (location.state?.chapter) {
      return parseInt(location.state.chapter, 10);
    }
    return parseInt(localStorage.getItem("bible-last-chapter") || "1", 10);
  });

  const targetVerseRef = useRef<number | null>(null);

  useEffect(() => {
    if (location.state?.bookName && location.state?.chapter) {
      const book = findBook(location.state.bookName);
      if (book) {
        const targetChapter = location.state.chapter;
        const targetVerse = location.state.verse;

        // Use a flag to avoid multiple state updates if possible
        let changed = false;

        if (currentBook.id !== book.id) {
          setCurrentBook(book);
          changed = true;
        }
        
        if (currentChapterNum !== targetChapter) {
          setCurrentChapterNum(targetChapter);
          changed = true;
        }

        if (targetVerse) {
          targetVerseRef.current = targetVerse;
          // If no state changed (already on same chapter), scroll now
          if (!changed && !loading) {
            const el = document.getElementById(`verse-${targetVerse}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            targetVerseRef.current = null;
          }
        } else if (!changed && !loading) {
          // Already on the right chapter, just scroll to top
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
      
      // Clear location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    location.state,
    navigate,
    location.pathname,
    currentBook.id,
    currentChapterNum,
    loading
  ]);

  useEffect(() => {
    localStorage.setItem("bible-last-book", currentBook.id);
    localStorage.setItem("bible-last-chapter", currentChapterNum.toString());
  }, [currentBook, currentChapterNum]);

  const [currentTranslation, setCurrentTranslation] = useState("kjv");

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectorTab, setSelectorTab] = useState<
    "books" | "chapters" | "versions" | "history" | "settings"
  >("books");

  const [readingHistory, setReadingHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem("bible-history");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("bible-history", JSON.stringify(readingHistory));
  }, [readingHistory]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const [isReadingChapter, setIsReadingChapter] = useState(false);
  const [isReadingPaused, setIsReadingPaused] = useState(false);
  const [currentReadingVerse, setCurrentReadingVerse] = useState<number | null>(
    null,
  );

  const [showScrollTop, setShowScrollTop] = useState(false);
  const isTransitioningRef = useRef(false);
  const stateRef = useRef({ currentBook, currentChapterNum, loading, chapter });

  useEffect(() => {
    stateRef.current = { currentBook, currentChapterNum, loading, chapter };
  }, [currentBook, currentChapterNum, loading, chapter]);

  const lastScrollTop = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      const { currentBook, currentChapterNum, loading, chapter } =
        stateRef.current;
      if (loading || !chapter) return;

      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;

      const isScrollingDown = scrollTop > lastScrollTop.current;
      const isScrollingUp = scrollTop < lastScrollTop.current;

      lastScrollTop.current = scrollTop;

      if (windowHeight + scrollTop >= docHeight - 10 && isScrollingDown) {
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;

          if (currentChapterNum < currentBook.chapters) {
            setCurrentChapterNum((prev) => prev + 1);
          } else {
            const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
            const nextBook = BIBLE_BOOKS[idx + 1];
            if (nextBook) {
              setCurrentBook(nextBook);
              setCurrentChapterNum(1);
            }
          }

          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 1500);
        }
      } else if (scrollTop <= 10 && isScrollingUp) {
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;

          if (currentChapterNum > 1) {
            setCurrentChapterNum((prev) => prev - 1);
          } else {
            const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
            if (idx > 0) {
              const prevBook = BIBLE_BOOKS[idx - 1];
              setCurrentBook(prevBook);
              setCurrentChapterNum(prevBook.chapters);
            }
          }

          // Important: ensure we don't instantly trigger again if we load at the top
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, 1500);
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [highlightMenu, setHighlightMenu] = useState<{
    verseNum: number;
    x: number;
    y: number;
  } | null>(null);
  const [highlights, setHighlights] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("bible-highlights");
    return saved ? JSON.parse(saved) : {};
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("bible-notes");
    return saved ? JSON.parse(saved) : {};
  });

  const [editingNote, setEditingNote] = useState<{
    key: string;
    text: string;
    verseNum: number;
  } | null>(null);

  const [aiExplanation, setAiExplanation] = useState<ExplanationResponse | null>(
    null,
  );
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  
  const [studyOpen, setStudyOpen] = useState(false);
  const [studyData, setStudyData] = useState<StudyAidResponse | null>(null);
  const [isStudyLoading, setIsStudyLoading] = useState(false);
  const [isPinning, setIsPinning] = useState(false);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isRedLetterEnabled, setIsRedLetterEnabled] = useState(true);
  const [jesusSpeech, setJesusSpeech] = useState<Record<string, string[]>>({});
  const [isDetectingSpeech, setIsDetectingSpeech] = useState(false);

  const NT_BOOK_IDS = [
    "matthew", "mark", "luke", "john", "acts", "romans", "1corinthians", "2corinthians",
    "galatians", "ephesians", "philippians", "colossians", "1thessalonians", "2thessalonians",
    "1timothy", "2timothy", "titus", "philemon", "hebrews", "james", "1peter", "2peter",
    "1john", "2john", "3john", "jude", "revelation"
  ];

  useEffect(() => {
    if (location.state?.studyMode) {
      setStudyOpen(true);
    }
  }, [location.state]);

  const loadStudyContext = async (verseNum?: number) => {
    if (!chapter) return;
    setIsStudyLoading(true);
    setStudyOpen(true);
    try {
      const verse = verseNum ? chapter.verses.find(v => v.number === verseNum) : null;
      const textToAnalyze = verse ? verse.text : chapter.verses.slice(0, 5).map(v => v.text).join(" ");
      const reference = verseNum ? `${chapter.bookName} ${chapter.number}:${verseNum}` : `${chapter.bookName} ${chapter.number}`;
      
      const result = await geminiService.getStudyContext(reference, textToAnalyze);
      setStudyData(result);
    } catch (err) {
      console.error("Study Context Error:", err);
    } finally {
      setIsStudyLoading(false);
    }
  };

  useEffect(() => {
    if (studyOpen && !studyData && !loading && chapter) {
      loadStudyContext();
    }
  }, [studyOpen, chapter, loading]);

  const [remindersEnabled, setRemindersEnabled] = useState(() => {
    return localStorage.getItem("bible-reminders-enabled") === "true";
  });
  const [reminderTime, setReminderTime] = useState(() => {
    return localStorage.getItem("bible-reminder-time") || "08:00";
  });

  useEffect(() => {
    localStorage.setItem(
      "bible-reminders-enabled",
      remindersEnabled.toString(),
    );
  }, [remindersEnabled]);

  useEffect(() => {
    localStorage.setItem("bible-reminder-time", reminderTime);
  }, [reminderTime]);

  // --- FIREBASE SYNC LOGIC ---
  const isInitialLoadRef = useRef(true);

  // 1. Initial Load from Firebase
  useEffect(() => {
    if (!user) return;

    const loadSyncData = async () => {
      setIsSyncing(true);
      try {
        const progressRef = doc(db, "users", user.uid, "settings", "bible");
        const docSnap = await getDoc(progressRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          if (data.lastBookId) {
            const book = BIBLE_BOOKS.find(b => b.id === data.lastBookId);
            if (book) setCurrentBook(book);
          }
          if (data.lastChapterNum) setCurrentChapterNum(data.lastChapterNum);
          if (data.lastVerseNum) {
            targetVerseRef.current = data.lastVerseNum;
          }
          if (data.fontSize) setFontSize(data.fontSize);
          if (data.highlights) setHighlights(data.highlights);
          if (data.notes) setNotes(data.notes);
          if (data.remindersEnabled !== undefined) setRemindersEnabled(data.remindersEnabled);
          if (data.reminderTime) setReminderTime(data.reminderTime);
        }
      } catch (error) {
        console.error("Error loading sync data:", error);
      } finally {
        setIsSyncing(false);
        isInitialLoadRef.current = false;
      }
    };

    loadSyncData();
  }, [user]);

  // 2. Debounced Save to Firebase
  useEffect(() => {
    if (!user || isInitialLoadRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const progressRef = doc(db, "users", user.uid, "settings", "bible");
        await setDoc(progressRef, {
          lastBookId: currentBook.id,
          lastChapterNum: currentChapterNum,
          lastVerseNum: targetVerseRef.current,
          fontSize,
          highlights,
          notes,
          remindersEnabled,
          reminderTime,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (error) {
        // Silently fail sync for better UX, but log if needed
        console.error("Sync preservation failed:", error);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timer);
  }, [user, currentBook.id, currentChapterNum, fontSize, highlights, notes, remindersEnabled, reminderTime]);
  // --- END FIREBASE SYNC LOGIC ---

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setRemindersEnabled(true);
      } else {
        alert(
          "Please enable notification permissions in your browser to receive daily reminders.",
        );
      }
    }
  };

  useEffect(() => {
    localStorage.setItem("bible-highlights", JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    localStorage.setItem("bible-notes", JSON.stringify(notes));
  }, [notes]);

  const HIGHLIGHT_COLORS = [
    { id: "yellow", value: "bg-yellow-400/30" },
    { id: "blue", value: "bg-blue-400/30" },
    { id: "green", value: "bg-green-400/30" },
    { id: "pink", value: "bg-pink-400/30" },
    { id: "clear", value: "" }, // to remove highlight
  ];

  const handleContextMenu = (e: MouseEvent, verseNum: number) => {
    e.preventDefault();
    setHighlightMenu({
      verseNum,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const applyHighlight = (colorValue: string) => {
    if (!highlightMenu) return;
    const key = `${currentBook.id}-${currentChapterNum}-${highlightMenu.verseNum}`;
    setHighlights((prev) => {
      const next = { ...prev };
      if (!colorValue) {
        delete next[key];
      } else {
        next[key] = colorValue;
      }
      return next;
    });
    setHighlightMenu(null);
  };

  const speak = (text: string, verseNum?: number) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (verseNum !== undefined) {
      setCurrentReadingVerse(verseNum);
      utterance.onend = () => {
        if (!isReadingChapter) setCurrentReadingVerse(null);
      };
    }

    window.speechSynthesis.speak(utterance);
    return utterance;
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsReadingChapter(false);
    setIsReadingPaused(false);
    setCurrentReadingVerse(null);
  };

  const togglePause = () => {
    if (isReadingPaused) {
      window.speechSynthesis.resume();
      setIsReadingPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsReadingPaused(true);
    }
  };

  const readChapter = async () => {
    if (!chapter) return;

    if (isReadingChapter) {
      stopSpeaking();
      return;
    }

    setIsReadingChapter(true);
    setIsReadingPaused(false);

    // We get a fresh boolean reference to track if this specific reading session is active
    let isCurrentSession = true;

    for (const verse of chapter.verses) {
      if (!isCurrentSession) break;
      setCurrentReadingVerse(verse.number);
      const utterance = speak(verse.text, verse.number);

      await new Promise((resolve) => {
        utterance.onend = resolve;
        utterance.onerror = resolve;
      });

      // Safety check if user stopped manually
      // if not speaking and not paused, we should break
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        break;
      }
    }
    setIsReadingChapter(false);
    setIsReadingPaused(false);
    setCurrentReadingVerse(null);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    async function loadContent() {
      setLoading(true);
      setError(null);
      setJesusSpeech({}); // Clear previous speech detection
      try {
        const data = await fetchChapter(
          currentBook.id,
          currentChapterNum,
          currentTranslation,
        );
        setChapter(data);

        // Detect Jesus' speech if it's New Testament and red letter is enabled
        if (isRedLetterEnabled && NT_BOOK_IDS.includes(currentBook.id)) {
          detectSpeech(data);
        }

        if (targetVerseRef.current !== null) {
          const verseToScroll = targetVerseRef.current;
          setTimeout(() => {
            const el = document.getElementById(`verse-${verseToScroll}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 400); // Increased timeout
          targetVerseRef.current = null;
        } else {
          window.scrollTo({ top: 0, behavior: "instant" });
          lastScrollTop.current = 0;
        }

        setReadingHistory((prev) => {
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            bookId: currentBook.id,
            bookName: currentBook.name,
            chapterNum: currentChapterNum,
            verseNum: targetVerseRef.current || undefined,
            translation: currentTranslation,
            timestamp: Date.now(),
          };
          const filtered = prev.filter(
            (h) =>
              !(
                h.bookId === currentBook.id &&
                h.chapterNum === currentChapterNum &&
                h.translation === currentTranslation
              ),
          );
          return [newItem, ...filtered].slice(0, 50);
        });
      } catch (err) {
        setError("Failed to load scripture. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }
    loadContent();
  }, [currentBook.id, currentChapterNum, currentTranslation]);

  const detectSpeech = async (bibleChapter: Chapter) => {
    setIsDetectingSpeech(true);
    try {
      const fullText = bibleChapter.verses.map(v => `${v.number}. ${v.text}`).join("\n");
      const reference = `${bibleChapter.bookName} ${bibleChapter.number}`;
      const result = await geminiService.detectJesusSpeech(reference, fullText);
      setJesusSpeech(result);
    } catch (err) {
      console.error("Speech Detection Error:", err);
    } finally {
      setIsDetectingSpeech(false);
    }
  };

  const renderVerseContent = (text: string, verseNum: number) => {
    const segments = jesusSpeech[verseNum.toString()];
    
    if (!isRedLetterEnabled || !segments || segments.length === 0) {
      return <BibleLinker text={text} onNavigate={navigateToVerse} />;
    }

    // If segments exist, we need to highlight them in red
    // To keep it simple and robust, we'll use a regex created from the segments
    // We escape special characters in segments first
    try {
      const sortedSegments = [...segments].sort((a, b) => b.length - a.length);
      const escapedSegments = sortedSegments.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const combinedRegex = new RegExp(`(${escapedSegments.join('|')})`, 'gi');
      
      const parts = text.split(combinedRegex);
      
      return (
        <span className="relative">
          {parts.map((part, i) => {
            const isJesusSpeech = segments.some(seg => part.toLowerCase().includes(seg.toLowerCase()) || seg.toLowerCase().includes(part.toLowerCase()));
            if (isJesusSpeech && part.trim().length > 0) {
              return (
                <span key={i} className="text-red-500/90 font-medium">
                  <BibleLinker text={part} onNavigate={navigateToVerse} />
                </span>
              );
            }
            return <span key={i}><BibleLinker text={part} onNavigate={navigateToVerse} /></span>;
          })}
        </span>
      );
    } catch (e) {
      // Fallback if regex fails
      return <BibleLinker text={text} onNavigate={navigateToVerse} className="text-red-500/90" />;
    }
  };

  const [lastClickTime, setLastClickTime] = useState<number>(0);

  const handleVerseClick = (text: string, verseNum: number) => {
    const now = Date.now();
    if (now - lastClickTime < 350) {
      // Double tap detected
      handleExplainVerse(verseNum);
      setLastClickTime(0);
    } else {
      setLastClickTime(now);
      speak(text, verseNum);
    }
  };

  const selectBook = (book: BibleBook) => {
    setCurrentBook(book);
    setSelectorTab("chapters");
  };

  const selectChapter = (num: number) => {
    setCurrentChapterNum(num);
    setSelectorOpen(false);
  };

  const handleExplainVerse = async (verseNum: number) => {
    const verseText = chapter?.verses.find((v) => v.number === verseNum)?.text;
    if (!verseText || !chapter) return;

    setHighlightMenu(null);
    setIsAiLoading(true);
    setAiError(null);
    setAiExplanation(null);

    try {
      const reference = `${chapter.bookName} ${chapter.number}:${verseNum}`;
      const result = await geminiService.explainVerse(verseText, reference);
      setAiExplanation(result);
    } catch (err) {
      console.error("Explain Verse Error:", err);
      setAiError("Failed to get AI explanation. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePinVerse = async (verseNum: number) => {
    const verse = chapter?.verses.find((v) => v.number === verseNum);
    if (!verse || !chapter || !user) return;

    setHighlightMenu(null);
    setIsPinning(true);
    try {
      const { journalService } = await import("../services/journalService");
      const entries = await journalService.getJournalEntries();
      
      let entryId = "";
      if (entries.length > 0) {
        entryId = entries[0].id;
      } else {
        entryId = await journalService.createEntry({
          content: "Pinned from my Bible study.",
          title: "Pinned Verses"
        });
      }

      const reference = `${chapter.bookName} ${chapter.number}:${verseNum}`;
      await journalService.pinVerse(entryId, reference, verse.text);
      setPinSuccess(reference);
      setTimeout(() => setPinSuccess(null), 3000);
    } catch (err) {
      console.error("Pin Verse Error:", err);
    } finally {
      setIsPinning(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const results = await searchBible(searchQuery, currentTranslation);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      bookmarkService.getBookmarks().then(setBookmarks);
    }
  }, [user]);

  const toggleBookmark = async (type: 'verse' | 'chapter', verseNum?: number) => {
    if (!user || !chapter) return;
    setIsBookmarking(true);
    try {
      const reference = type === 'verse' 
        ? `${chapter.bookName} ${chapter.number}:${verseNum}`
        : `${chapter.bookName} ${chapter.number}`;
      
      const existing = bookmarks.find(b => b.reference === reference);
      
      if (existing) {
        await bookmarkService.removeBookmark(existing.id);
        setBookmarks(prev => prev.filter(b => b.id !== existing.id));
      } else {
        const verse = type === 'verse' ? chapter.verses.find(v => v.number === verseNum) : null;
        const newId = await bookmarkService.addBookmark({
          type,
          reference,
          text: verse?.text,
          bookId: currentBook.id,
          chapterNum: currentChapterNum,
          verseNum
        });
        setBookmarks(prev => [{
          id: newId,
          type,
          reference,
          text: verse?.text,
          bookId: currentBook.id,
          chapterNum: currentChapterNum,
          verseNum
        }, ...prev]);
        
        setPinSuccess(reference);
        setTimeout(() => setPinSuccess(null), 2000);
      }
    } catch (err) {
      console.error("Bookmark Error:", err);
    } finally {
      setIsBookmarking(false);
      setHighlightMenu(null);
    }
  };

  const isBookmarked = (type: 'verse' | 'chapter', verseNum?: number) => {
    const reference = type === 'verse' 
      ? `${chapter?.bookName} ${chapter?.number}:${verseNum}`
      : `${chapter?.bookName} ${chapter?.number}`;
    return bookmarks.some(b => b.reference === reference);
  };

  const navigateToVerse = (bookName: string, chapterNum: number, verseNum?: number) => {
    const book = findBook(bookName);
    if (book) {
      setCurrentBook(book);
      setCurrentChapterNum(chapterNum);
      if (verseNum) {
        targetVerseRef.current = verseNum;
      }
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const goToPreviousChapter = () => {
    if (
      currentChapterNum === 1 &&
      BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id) === 0
    )
      return;
    if (currentChapterNum > 1) {
      setCurrentChapterNum((prev) => prev - 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
      if (idx > 0) {
        const prevBook = BIBLE_BOOKS[idx - 1];
        setCurrentBook(prevBook);
        setCurrentChapterNum(prevBook.chapters);
      }
    }
  };

  const goToNextChapter = () => {
    if (currentChapterNum < currentBook.chapters) {
      setCurrentChapterNum((prev) => prev + 1);
    } else {
      const idx = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
      const nextBook = BIBLE_BOOKS[idx + 1];
      if (nextBook) {
        setCurrentBook(nextBook);
        setCurrentChapterNum(1);
      }
    }
  };

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Check if horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 80) {
      if (deltaX > 0) {
        goToNextChapter();
      } else {
        goToPreviousChapter();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const renderVerseText = (text: string) => (
    <BibleLinker
      text={text}
      onNavigate={(bookName, chapter, verse) => {
        const book = BIBLE_BOOKS.find(
          (b) =>
            b.name.toLowerCase() === bookName.toLowerCase() ||
            b.id.toLowerCase() === bookName.toLowerCase(),
        );
        if (book) {
          setCurrentBook(book);
          setCurrentChapterNum(chapter);
          targetVerseRef.current = verse;
        }
      }}
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-dark-bg text-[#E2E8F0] transition-colors duration-500"
    >
      {/* Reader Header */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-dark-bg/80 backdrop-blur-md flex items-center justify-between px-4 z-40 border-b border-white/5">
        <button
          onClick={() => navigate("/dashboard")}
          className="p-2 -ml-1 text-white/40 hover:text-white active:scale-90 transition-all"
        >
          <ChevronLeft className="w-6 h-6" strokeWidth={1.25} />
        </button>

        <div className="flex gap-2 items-center max-w-[50%] justify-center">
          {user && (
            <div className={cn(
              "p-1.5 rounded-full",
              isSyncing ? "animate-pulse text-brand-primary" : "text-white/20"
            )} title={isSyncing ? "Syncing..." : "Progress Saved"}>
              <Cloud className="w-3.5 h-3.5" strokeWidth={1.5} />
            </div>
          )}
          <button
            onClick={() => setSelectorOpen(true)}
            className="flex gap-1.5 sm:gap-2 items-center px-4 py-1.5 bg-white/[0.03] rounded-full border border-white/5 hover:bg-white/10 transition-colors shrink-0"
          >
            <span className="text-xs font-bold text-white/80 truncate">
              {currentBook.name} {currentChapterNum}
            </span>
            <ChevronRight className="w-3 h-3 text-white/20 rotate-90 shrink-0" strokeWidth={1.25} />
          </button>

          <button
            onClick={() => toggleBookmark('chapter')}
            disabled={isBookmarking}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border transition-all",
              isBookmarked('chapter') 
                ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary" 
                : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white"
            )}
          >
            {isBookmarking ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Bookmark className={cn("w-3.5 h-3.5", isBookmarked('chapter') && "fill-current")} />
            )}
          </button>

          <button
            onClick={() => {
              setSelectorTab("versions");
              setSelectorOpen(true);
            }}
            className="flex gap-1.5 items-center px-3 py-1.5 bg-brand-primary/[0.08] rounded-full border border-brand-primary/10 hover:bg-brand-primary/20 transition-colors shrink-0"
          >
            <span className="text-[10px] sm:text-xs font-black tracking-widest text-brand-primary">
              {BIBLE_VERSIONS.find((v) => v.id === currentTranslation)
                ?.abbrev || currentTranslation.toUpperCase()}
            </span>
          </button>
        </div>

        <div className="flex gap-0.5 items-center">
          <button
            onClick={() => setStudyOpen(!studyOpen)}
            className={cn(
              "p-2.5 transition-colors",
              studyOpen ? "text-brand-primary" : "text-white/40 hover:text-white"
            )}
            title="Study Tools"
          >
            <Library className="w-5 h-5" strokeWidth={1.25} />
          </button>
          {isReadingChapter ? (
            <>
              <button
                onClick={togglePause}
                className="p-2 transition-colors text-brand-primary"
                title={isReadingPaused ? "Resume" : "Pause"}
              >
                {isReadingPaused ? (
                  <Play className="w-5 h-5 fill-current" strokeWidth={1.25} />
                ) : (
                  <Pause className="w-5 h-5 fill-current" strokeWidth={1.25} />
                )}
              </button>
              <button
                onClick={stopSpeaking}
                className="p-2 transition-colors text-white/30 hover:text-red-400"
                title="Stop reading"
              >
                <Square className="w-5 h-5 fill-current" strokeWidth={1.25} />
              </button>
            </>
          ) : (
            <button
              onClick={readChapter}
              className="p-2.5 transition-colors text-white/40 hover:text-white"
              title="Listen to chapter"
            >
              <Headphones className="w-5 h-5" strokeWidth={1.25} />
            </button>
          )}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2.5 text-white/40 hover:text-white"
            title="Search"
          >
            <Search className="w-5 h-5" strokeWidth={1.25} />
          </button>
        </div>
      </nav>

      {/* Content */}
      <main
        className="pt-28 pb-48 px-8 max-w-2xl mx-auto min-h-screen"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-20 gap-4 opacity-50"
            >
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
              <p className="text-sm font-bold tracking-widest uppercase">
                Preparing the Word
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-20"
            >
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-brand-primary font-bold px-6 py-2 bg-brand-primary/10 rounded-xl"
              >
                Retry
              </button>
            </motion.div>
          ) : (
            chapter && (
              <motion.div
                key={`${chapter.bookId}-${chapter.number}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <header className="mb-14 text-center mt-4">
                  <h1 className="text-3xl font-bold mb-3 tracking-tight">
                    {chapter.bookName} {chapter.number}
                  </h1>
                  <p className="text-brand-primary/40 text-[9px] font-black uppercase tracking-[0.3em]">
                    {chapter.version}
                  </p>
                </header>

                <article
                  className="leading-relaxed font-serif text-white/60 select-none pb-12"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {chapter.verses.map((verse) => {
                    const isActive = currentReadingVerse === verse.number;
                    const highlightKey = `${currentBook.id}-${currentChapterNum}-${verse.number}`;
                    const highlightColor = highlights[highlightKey];
                    const noteKey = `${currentBook.id}-${currentChapterNum}-${verse.number}`;
                    const hasNote = !!notes[noteKey];

                    return (
                      <span
                        key={verse.number}
                        id={`verse-${verse.number}`}
                        className="relative block mb-8 group"
                        onContextMenu={(e) =>
                          handleContextMenu(e, verse.number)
                        }
                      >
                        <span
                          className={cn(
                            "absolute -left-10 top-0.5 w-9 flex flex-col items-end gap-1.5 text-[15px] font-black tracking-widest font-sans transition-colors",
                            isActive
                              ? "text-brand-primary drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                              : "text-brand-primary/40",
                          )}
                        >
                          <span className="block text-right w-full">
                            {verse.number}
                          </span>
                          <div className="flex flex-col items-end gap-2 mt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExplainVerse(verse.number);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary/40 hover:text-brand-primary p-1 bg-white/[0.03] rounded-md"
                              title="AI Insight"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                            </button>
                            {hasNote && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingNote({
                                    key: noteKey,
                                    text: notes[noteKey],
                                    verseNum: verse.number,
                                  });
                                }}
                                title="View Note"
                                className="text-brand-primary/40 hover:text-brand-primary"
                              >
                                <StickyNote className="w-2.5 h-2.5" strokeWidth={1.25} />
                              </button>
                            )}
                          </div>
                        </span>
                        <span
                          onClick={() => handleVerseClick(verse.text, verse.number)}
                          className={cn(
                            "transition-all duration-300 rounded-lg px-2 -mx-2 block cursor-pointer",
                            isActive
                              ? "text-white bg-brand-primary/10"
                              : "hover:text-white/[0.9] hover:bg-white/[0.02]",
                            highlightColor && !isActive ? highlightColor : "",
                          )}
                        >
                          {renderVerseContent(verse.text, verse.number)}
                          <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Volume2 className="w-3 h-3 inline text-brand-primary/40" strokeWidth={1.25} />
                          </span>
                        </span>
                      </span>
                    );
                  })}
                </article>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </main>

      {/* Study Panel */}
      <AnimatePresence>
        {studyOpen && (
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[380px] bg-[#0F1115]/95 backdrop-blur-2xl border-l border-white/5 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5 text-brand-primary" strokeWidth={1.5} />
                <h2 className="text-lg font-bold tracking-tight">Study Center</h2>
              </div>
              <button 
                onClick={() => setStudyOpen(false)}
                className="p-2 text-white/30 hover:text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
              {isStudyLoading ? (
                <div className="flex flex-col items-center justify-center p-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/20">Curating Study Materials...</p>
                </div>
              ) : studyData ? (
                <>
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-4 h-4 text-brand-primary" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Theological Insights</h3>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-[24px] p-5">
                      <p className="text-sm text-white/70 leading-relaxed font-serif italic text-pretty">
                        {renderVerseText(studyData.theologyInsights)}
                      </p>
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpenText className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Cross References</h3>
                    </div>
                    <div className="space-y-4">
                      {studyData.crossReferences.map((ref, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const parsed = parseBibleReference(ref.reference);
                            if (parsed) {
                              navigateToVerse(parsed.bookName, parsed.chapter, parsed.verse);
                            }
                          }}
                          className="w-full text-left bg-[#1C1F26] border border-white/5 rounded-2xl p-4 hover:border-brand-primary/20 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-brand-primary font-bold text-xs uppercase tracking-wider">{ref.reference}</span>
                            <ArrowUpRight className="w-3 h-3 text-white/10 group-hover:text-brand-primary transition-colors" />
                          </div>
                          <p className="text-xs text-white/50 mb-2 line-clamp-2 italic font-serif">"{ref.text}"</p>
                          <p className="text-[9px] text-white/20 uppercase font-black tracking-widest leading-tight">{ref.reason}</p>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Key Biblical Terms</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {studyData.keyTerms.map((term, idx) => (
                        <div key={idx} className="bg-white/[0.03] border border-white/[0.02] rounded-2xl p-4">
                          <h4 className="text-white/80 font-bold mb-1">{term.term}</h4>
                          <p className="text-[11px] text-white/40 leading-relaxed">{term.definition}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <div className="text-center p-12 text-white/20">
                  <Library className="w-12 h-12 mx-auto mb-4 opacity-5" />
                  <p>Study center provides context-aware insights for your current reading.</p>
                  <button 
                    onClick={loadStudyContext}
                    className="mt-6 px-6 py-2 bg-brand-primary/10 text-brand-primary font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-brand-primary/20 transition-all"
                  >
                    Refresh insights
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 bg-[#0F1115]">
              <button 
                onClick={() => setStudyOpen(false)}
                className="w-full bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-bold transition-all text-white/60"
              >
                Close Center
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Book/Chapter Selector Modal */}
      <AnimatePresence>
        {selectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-dark-bg/95 flex flex-col p-6 backdrop-blur-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4 sm:gap-6 overflow-x-auto custom-scrollbar pr-4 pb-2 -mb-2">
                <button
                  onClick={() => setSelectorTab("books")}
                  className={cn(
                    "text-xl font-bold tracking-tight pb-1 border-b-2 transition-all whitespace-nowrap",
                    selectorTab === "books"
                      ? "text-white border-brand-primary"
                      : "text-white/20 border-transparent",
                  )}
                >
                  Books
                </button>
                <button
                  onClick={() => setSelectorTab("chapters")}
                  className={cn(
                    "text-xl font-bold tracking-tight pb-1 border-b-2 transition-all whitespace-nowrap",
                    selectorTab === "chapters"
                      ? "text-white border-brand-primary"
                      : "text-white/20 border-transparent",
                  )}
                >
                  Chapters
                </button>
                <button
                  onClick={() => setSelectorTab("versions")}
                  className={cn(
                    "text-xl font-bold tracking-tight pb-1 border-b-2 transition-all whitespace-nowrap",
                    selectorTab === "versions"
                      ? "text-white border-brand-primary"
                      : "text-white/20 border-transparent",
                  )}
                >
                  Version
                </button>
                <button
                  onClick={() => setSelectorTab("history")}
                  className={cn(
                    "text-lg font-bold tracking-tight pb-1 border-b-2 transition-all whitespace-nowrap flex items-center gap-2",
                    selectorTab === "history"
                      ? "text-white border-brand-primary"
                      : "text-white/20 border-transparent",
                  )}
                >
                  <History className="w-4 h-4" strokeWidth={1.25} />
                  History
                </button>
                <button
                  onClick={() => setSelectorTab("settings")}
                  className={cn(
                    "text-lg font-bold tracking-tight pb-1 border-b-2 transition-all whitespace-nowrap flex items-center gap-2",
                    selectorTab === "settings"
                      ? "text-white border-brand-primary"
                      : "text-white/20 border-transparent",
                  )}
                >
                  Settings
                </button>
              </div>
              <button
                onClick={() => setSelectorOpen(false)}
                className="p-2 text-white/30 hover:text-white"
              >
                <X className="w-6 h-6" strokeWidth={1.25} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {selectorTab === "books" ? (
                <div className="grid grid-cols-2 gap-3">
                  {BIBLE_BOOKS.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => selectBook(book)}
                      className={cn(
                        "p-4 rounded-2xl text-left transition-all border",
                        currentBook.id === book.id
                          ? "bg-brand-primary/10 border-brand-primary/40 text-brand-primary"
                          : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10",
                      )}
                    >
                      <p className="font-bold">{book.name}</p>
                      <p className="text-[10px] uppercase font-bold tracking-widest opacity-40">
                        {book.chapters} Chapters
                      </p>
                    </button>
                  ))}
                </div>
              ) : selectorTab === "chapters" ? (
                <div className="grid grid-cols-4 gap-3">
                  {Array.from(
                    { length: currentBook.chapters },
                    (_, i) => i + 1,
                  ).map((n) => (
                    <button
                      key={n}
                      onClick={() => selectChapter(n)}
                      className={cn(
                        "aspect-square rounded-2xl flex items-center justify-center font-bold text-lg transition-all border",
                        currentChapterNum === n
                          ? "bg-brand-primary border-transparent text-white shadow-lg shadow-brand-primary/20"
                          : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              ) : selectorTab === "history" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                      Recent Sessions
                    </p>
                    {readingHistory.length > 0 && (
                      <button
                        onClick={() => {
                          if (confirm("Clear all reading history?")) {
                            setReadingHistory([]);
                          }
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {readingHistory.length === 0 ? (
                    <div className="text-center p-12 text-white/40 flex flex-col items-center bg-white/5 rounded-3xl border border-white/5">
                      <History className="w-12 h-12 mb-4 opacity-10" />
                      <p className="font-bold text-white/60">No history yet</p>
                      <p className="text-xs mt-1 leading-relaxed max-w-[180px]">
                        The chapters you read will automatically appear here.
                      </p>
                    </div>
                  ) : (
                    readingHistory.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          const book = BIBLE_BOOKS.find(
                            (b) => b.id === item.bookId,
                          );
                          if (book) {
                            setCurrentBook(book);
                            setCurrentChapterNum(item.chapterNum);
                            setCurrentTranslation(item.translation);
                            if (item.verseNum) {
                              targetVerseRef.current = item.verseNum;
                            }
                            setSelectorOpen(false);
                          }
                        }}
                        className="p-5 rounded-2xl text-left transition-all border bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10 flex justify-between items-center group relative overflow-hidden"
                      >
                        <div className="relative z-10">
                          <p className="font-bold text-lg text-white group-hover:text-brand-primary transition-colors flex items-center gap-2">
                            {item.bookName} {item.chapterNum}
                            {item.verseNum && (
                              <span className="text-[14px] opacity-80 font-black ml-1 text-brand-primary">
                                v.{item.verseNum}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mt-1 font-bold">
                            {BIBLE_VERSIONS.find(
                              (v) => v.id === item.translation,
                            )?.abbrev || item.translation}{" "}
                            • {new Date(item.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-[10px] opacity-20 font-bold uppercase tracking-widest relative z-10">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="absolute top-0 right-0 bottom-0 w-1 bg-brand-primary/0 group-hover:bg-brand-primary/40 transition-all" />
                      </button>
                    ))
                  )}
                </div>
              ) : selectorTab === "versions" ? (
                <div className="grid grid-cols-1 gap-3">
                  {BIBLE_VERSIONS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setCurrentTranslation(v.id);
                        setSelectorOpen(false);
                      }}
                      className={cn(
                        "p-5 rounded-2xl text-left transition-all border flex items-center justify-between",
                        currentTranslation === v.id
                          ? "bg-brand-primary/10 border-brand-primary/40 text-brand-primary"
                          : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10",
                      )}
                    >
                      <div>
                        <p className="font-bold text-lg">{v.name}</p>
                        <p className="text-xs opacity-50">
                          Translation Code: {v.abbrev}
                        </p>
                      </div>
                      {currentTranslation === v.id && (
                        <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-bold text-white/50 uppercase tracking-wider px-1">
                      Typography
                    </span>
                    <div className="flex items-center justify-between bg-white/5 rounded-full p-2 border border-white/5">
                      <button
                        onClick={() => setFontSize((f) => Math.max(12, f - 2))}
                        className="w-12 h-12 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                        title="Decrease font size"
                      >
                        <span className="text-lg font-bold">A-</span>
                      </button>
                      <span className="text-sm font-medium text-white/50">
                        {fontSize}px
                      </span>
                      <button
                        onClick={() => setFontSize((f) => Math.min(32, f + 2))}
                        className="w-12 h-12 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors"
                        title="Increase font size"
                      >
                        <span className="text-xl font-bold">A+</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4 border-t border-white/5 pt-6">
                    <span className="text-sm font-bold text-white/50 uppercase tracking-wider px-1">
                      Daily Reminders
                    </span>
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-xl transition-colors",
                              remindersEnabled
                                ? "bg-brand-primary/20 text-brand-primary"
                                : "bg-white/10 text-white/40",
                            )}
                          >
                            <Bell className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold">Daily Verse</p>
                            <p className="text-xs text-white/30">
                              Get notified every morning
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (!remindersEnabled) {
                              requestNotificationPermission();
                            } else {
                              setRemindersEnabled(false);
                            }
                          }}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-colors duration-300",
                            remindersEnabled ? "bg-brand-primary" : "bg-white/10",
                          )}
                        >
                          <motion.div
                            animate={{ x: remindersEnabled ? 24 : 4 }}
                            transition={{
                              type: "spring",
                              stiffness: 500,
                              damping: 30,
                            }}
                            className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                          />
                        </button>
                      </div>

                      {remindersEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col gap-3 pt-2"
                        >
                          <p className="text-xs font-bold text-white/30 uppercase tracking-widest">
                            Preferred Time
                          </p>
                          <div className="relative">
                            <input
                              type="time"
                              value={reminderTime}
                              onChange={(e) => setReminderTime(e.target.value)}
                              className="w-full bg-white/5 border border-white/5 rounded-xl py-3 px-4 outline-none focus:border-brand-primary/40 focus:bg-white/10 transition-all text-white font-medium"
                            />
                          </div>
                          <p className="text-[10px] text-white/20 italic">
                            You'll receive a reminder at {reminderTime} each day.
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[70] bg-dark-bg flex flex-col p-6 overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-8">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search keywords or verses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-brand-primary/40 focus:bg-white/10 transition-all text-lg"
                />
              </form>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {searchLoading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4 opacity-50">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Searching the Word
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-primary/60 mb-2">
                    Found {searchResults.length} results
                  </p>
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        navigateToVerse(result.book_name, result.chapter, result.verse)
                      }
                      className="text-left bg-white/5 border border-white/5 p-5 rounded-3xl hover:bg-white/10 transition-all group"
                    >
                      <h4 className="font-bold text-brand-primary mb-2 group-hover:translate-x-1 transition-transform flex items-baseline gap-1">
                        {result.book_name} {result.chapter}:<span className="text-xl font-black">{result.verse}</span>
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed font-serif italic">
                        "{result.text.trim()}"
                      </p>
                    </button>
                  ))}
                </div>
              ) : searchQuery && !searchLoading ? (
                <div className="text-center p-20 text-white/40">
                  <p>No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="text-center p-20 text-white/20">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="max-w-[200px] mx-auto">
                    Explore wisdom by searching keywords like "love", "faith",
                    or "peace".
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-6 z-40"
          >
            <button
              onClick={scrollToTop}
              className="p-3 bg-[#1C1F26]/80 text-white/50 hover:text-white hover:scale-105 active:scale-95 rounded-full border border-white/10 shadow-lg backdrop-blur-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5 rotate-90" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlight Context Menu */}
      <AnimatePresence>
        {highlightMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              onClick={() => setHighlightMenu(null)}
              onContextMenu={(e) => {
                e.preventDefault();
                setHighlightMenu(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed z-[51] bg-[#1C1F26]/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-4 flex flex-col min-w-[200px]"
              style={{
                top: Math.min(highlightMenu.y, window.innerHeight - 320),
                left: Math.min(highlightMenu.x, window.innerWidth - 220),
              }}
            >
              <div className="flex justify-between items-center mb-4 px-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Select Action</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-brand-primary flex items-center gap-1.5">
                  Verse <span className="text-sm">{highlightMenu.verseNum}</span>
                </p>
              </div>

              <div className="flex gap-2.5 mb-4 px-1">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => applyHighlight(color.value)}
                    className={cn(
                      "w-8 h-8 rounded-full border border-white/10 hover:scale-110 transition-transform flex items-center justify-center",
                      color.value === ""
                        ? "bg-white/5 border-dashed border-white/20 text-white/50"
                        : color.value.replace("/30", ""),
                    )}
                    title={
                      color.id === "clear"
                        ? "Remove Highlight"
                        : `Highlight ${color.id}`
                    }
                  >
                    {color.id === "clear" && <X className="w-4 h-4" />}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    const key = `${currentBook.id}-${currentChapterNum}-${highlightMenu.verseNum}`;
                    setEditingNote({
                      key,
                      text: notes[key] || "",
                      verseNum: highlightMenu.verseNum,
                    });
                    setHighlightMenu(null);
                  }}
                  className="w-full h-11 px-4 rounded-2xl border border-white/5 flex items-center gap-3 bg-white/[0.03] hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                >
                  <StickyNote className="w-4 h-4" />
                  <span className="text-sm font-bold">Add Note</span>
                </button>

                <button
                  onClick={() => handleExplainVerse(highlightMenu.verseNum)}
                  className="w-full h-11 px-4 rounded-2xl border border-brand-primary/10 flex items-center gap-3 bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors text-brand-primary"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold">AI Explain</span>
                </button>

                <button
                  onClick={() => {
                    loadStudyContext(highlightMenu.verseNum);
                    setHighlightMenu(null);
                  }}
                  className="w-full h-11 px-4 rounded-2xl border border-blue-500/10 flex items-center gap-3 bg-blue-500/5 hover:bg-blue-500/10 transition-colors text-blue-400"
                >
                  <Library className="w-4 h-4" />
                  <span className="text-sm font-bold">Deep Study</span>
                </button>

                <button
                  onClick={() => handlePinVerse(highlightMenu.verseNum)}
                  disabled={isPinning}
                  className="w-full h-11 px-4 rounded-2xl border border-white/5 flex items-center gap-3 bg-white/[0.03] hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                >
                  {isPinning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Quote className="w-4 h-4" />}
                  <span className="text-sm font-bold">Pin to Journal</span>
                </button>

                <button
                  onClick={() => toggleBookmark('verse', highlightMenu.verseNum)}
                  disabled={isBookmarking}
                  className={cn(
                    "w-full h-11 px-4 rounded-2xl border flex items-center gap-3 transition-all",
                    isBookmarked('verse', highlightMenu.verseNum)
                      ? "bg-brand-primary/10 border-brand-primary/20 text-brand-primary"
                      : "bg-white/[0.03] border-white/5 text-white/40 hover:text-white"
                  )}
                >
                  {isBookmarking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className={cn("w-4 h-4", isBookmarked('verse', highlightMenu.verseNum) && "fill-current")} />}
                  <span className="text-sm font-bold">
                    {isBookmarked('verse', highlightMenu.verseNum) ? 'Remove Bookmark' : 'Bookmark Verse'}
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Pin Toast */}
      <AnimatePresence>
        {pinSuccess && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 z-[120] md:left-auto md:right-8 md:w-80"
          >
            <div className="bg-[#1C1F26]/90 backdrop-blur-2xl border border-brand-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary shadow-lg shadow-brand-primary/10">
                <Bookmark className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white tracking-tight leading-none mb-1">Verse Pinned</h3>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">{pinSuccess}</p>
              </div>
              <button 
                onClick={() => setPinSuccess(null)}
                className="p-1 text-white/10 hover:text-white/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Explanation Modal */}
      <AnimatePresence>
        {(isAiLoading || aiExplanation || aiError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => {
              if (!isAiLoading) {
                setAiExplanation(null);
                setAiError(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1F26] border border-white/10 shadow-2xl rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto no-scrollbar"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Spiritual Insight</h3>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-white/30">
                        Powered by Gemini AI
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAiExplanation(null);
                      setAiError(null);
                      setIsAiLoading(false);
                    }}
                    className="p-2 -mr-2 text-white/30 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {isAiLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                    <p className="text-sm font-medium text-white/40 italic">
                      Seeking clarity and context...
                    </p>
                  </div>
                ) : aiError ? (
                  <div className="p-4 bg-red-400/5 border border-red-400/10 rounded-2xl text-red-400 text-sm text-center">
                    {aiError}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <section>
                      <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary py-1 mb-2 border-b border-brand-primary/10 inline-block">
                        Plain English Summary
                      </h4>
                      <p className="text-white/80 leading-relaxed font-serif text-lg italic">
                        "{renderVerseText(aiExplanation?.summary || "")}"
                      </p>
                    </section>

                    <section className="bg-white/[0.02] p-6 rounded-[32px] border border-white/5">
                      <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40 mb-3 block">
                        Historical Context
                      </h4>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {renderVerseText(aiExplanation?.historicalContext || "")}
                      </p>
                    </section>

                    <section className="bg-brand-primary/[0.03] p-6 rounded-[32px] border border-brand-primary/10">
                      <h4 className="text-[10px] uppercase font-black tracking-[0.2em] text-brand-primary/40 mb-3 block">
                        Spiritual Application
                      </h4>
                      <p className="text-sm text-white/70 leading-relaxed font-medium">
                        {renderVerseText(aiExplanation?.application || "")}
                      </p>
                    </section>

                    <button
                      onClick={() => {
                        setAiExplanation(null);
                        setAiError(null);
                      }}
                      className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all"
                    >
                      Close Insight
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Note Edit Modal */}
      <AnimatePresence>
        {editingNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditingNote(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1C1F26] border border-white/10 shadow-2xl rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  Note for {currentBook.name} {currentChapterNum}:
                  {editingNote.verseNum}
                </h3>
                <button
                  onClick={() => setEditingNote(null)}
                  className="p-2 -mr-2 text-white/50 hover:text-white rounded-full hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <textarea
                autoFocus
                value={editingNote.text}
                onChange={(e) =>
                  setEditingNote((prev) =>
                    prev ? { ...prev, text: e.target.value } : null,
                  )
                }
                placeholder="Write your note here..."
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 resize-none mb-4"
              />
              <div className="flex justify-end gap-3">
                {notes[editingNote.key] && (
                  <button
                    onClick={() => {
                      setNotes((prev) => {
                        const next = { ...prev };
                        delete next[editingNote.key];
                        return next;
                      });
                      setEditingNote(null);
                    }}
                    className="px-4 py-2 rounded-xl text-red-400 hover:bg-red-400/10 font-bold transition-colors"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => {
                    if (editingNote.text.trim()) {
                      setNotes((prev) => ({
                        ...prev,
                        [editingNote.key]: editingNote.text.trim(),
                      }));
                    } else {
                      setNotes((prev) => {
                        const next = { ...prev };
                        delete next[editingNote.key];
                        return next;
                      });
                    }
                    setEditingNote(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-brand-primary text-white font-bold hover:bg-opacity-90 transition-colors"
                >
                  Save Note
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
