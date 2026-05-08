export interface Book {
  id: string;
  name: string;
  chapters: number;
}

export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  bookId: string;
  bookName: string;
  number: number;
  verses: Verse[];
  version: string;
}

export interface ReadingProgress {
  bookId: string;
  bookName: string;
  chapter: number;
  percent: number;
  lastRead: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  durationDays: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  tasks: string[];
  icon: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title?: string;
  content: string;
  pinnedVerses?: {
    reference: string;
    text: string;
  }[];
  prompt?: string;
  createdAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  type: 'verse' | 'chapter';
  reference: string; // e.g., "John 3:16" or "John 3"
  text?: string; // Optional for chapters
  bookId: string;
  chapterNum: number;
  verseNum?: number;
  createdAt: string;
}
