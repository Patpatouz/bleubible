import { BIBLE_BOOKS, BibleBook } from "../data/bibleBooks";

export interface BibleReference {
  bookName: string; // This will be the book ID (e.g. 'john')
  chapter: number;
  verse?: number;
}

/**
 * Finds a book by matching its name or ID.
 */
export const findBook = (text: string): BibleBook | undefined => {
  if (!text) return undefined;
  const lower = text.toLowerCase().trim();
  
  // Try exact matches first
  let book = BIBLE_BOOKS.find(
    (b) => b.id.toLowerCase() === lower || b.name.toLowerCase() === lower
  );
  
  if (!book) {
    // Special case for Psalm vs Psalms
    if (lower === "psalm" || lower === "psalms") {
      return BIBLE_BOOKS.find(b => b.id === "psalms");
    }

    // Try startsWith/partial matches
    book = BIBLE_BOOKS.find((b) => {
      const lowerName = b.name.toLowerCase();
      const lowerId = b.id.toLowerCase();
      return lowerName.startsWith(lower) || lower.startsWith(lowerName) || 
             lowerId.startsWith(lower) || lower.startsWith(lowerId);
    });
  }
  
  return book;
};

/**
 * Parses a string to extract a Bible reference.
 * Supports strings like: 
 * - "John 3:16"
 * - "Read John 3:16"
 * - "1 Peter 5:7"
 * - "Genesis 1"
 */
export const parseBibleReference = (text: string): BibleReference | null => {
  if (!text) return null;

  // Build a list of searchable book names
  const bookNames = BIBLE_BOOKS.flatMap(b => [b.name, b.id, b.id === 'psalms' ? 'Psalm' : '']);
  const bookPatterns = bookNames
    .filter(name => name.length > 0)
    .sort((a, b) => b.length - a.length) // Longest first to avoid partial matches
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  // Regex matches:
  // 1. Optional action word
  // 2. The book from our patterns
  // 3. Chapter number
  // 4. Optional verse number (and optional range like 2-3)
  const regex = new RegExp(`(?:Read|Meditate on|See|Study|In|On|At)?\\s*(${bookPatterns})\\s+(\\d+)(?::(\\d+)(?:-\\d+)?)?`, "i");
  const match = text.match(regex);
  
  if (match) {
    const bookNamePart = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : undefined;
    
    const book = findBook(bookNamePart);
    
    if (book) {
      return { 
        bookName: book.id, 
        chapter, 
        verse 
      };
    }
  }
  
  return null;
};
