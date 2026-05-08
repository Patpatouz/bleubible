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
