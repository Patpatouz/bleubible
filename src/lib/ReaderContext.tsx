import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

interface ReaderContextType {
  fontSize: number;
  setFontSize: (size: number | ((prev: number) => number)) => void;
  isRedLetter: boolean;
  setIsRedLetter: (enabled: boolean) => void;
  loading: boolean;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [user] = useAuthState(auth);
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('reader-font-size') || '18', 10);
  });
  const [isRedLetter, setIsRedLetter] = useState(() => {
    return localStorage.getItem('reader-red-letter') !== 'false';
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('reader-font-size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader-red-letter', isRedLetter.toString());
  }, [isRedLetter]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadPrefs = async () => {
      try {
        const prefRef = doc(db, 'users', user.uid, 'settings', 'bible');
        const snap = await getDoc(prefRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.fontSize) setFontSize(data.fontSize);
          if (data.isRedLetter !== undefined) setIsRedLetter(data.isRedLetter);
        }
      } catch (e) {
        console.error("Error loading reader preferences:", e);
      } finally {
        setLoading(false);
      }
    };

    loadPrefs();
  }, [user]);

  // Debounced save
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(async () => {
      try {
        const prefRef = doc(db, 'users', user.uid, 'settings', 'bible');
        await setDoc(prefRef, {
          fontSize,
          isRedLetter,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Error saving reader preferences:", e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, fontSize, isRedLetter]);

  return (
    <ReaderContext.Provider value={{ fontSize, setFontSize, isRedLetter, setIsRedLetter, loading }}>
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
}
