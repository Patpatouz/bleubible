import { Chapter, Verse } from '../types';

const BASE_URL = 'https://bible-api.com';

export async function fetchChapter(bookId: string, chapter: number, translation: string = 'kjv'): Promise<Chapter> {
  try {
    // Map internal IDs to API names if needed
    const apiBookName = bookId.replace(/([0-9])([a-z])/, '$1 $2');
    const response = await fetch(`${BASE_URL}/${apiBookName}+${chapter}?translation=${translation}`);
    
    if (!response.ok) {
      throw new Error('Bible API response was not ok');
    }
    
    const data = await response.json();
    
    return {
      bookId,
      bookName: data.verses[0].book_name,
      number: chapter,
      version: data.translation_name,
      verses: data.verses.map((v: any) => ({
        number: v.verse,
        text: v.text
      }))
    };
  } catch (error) {
    console.error('Error fetching Bible chapter:', error);
    throw error;
  }
}

export async function searchBible(query: string, translation: string = 'kjv'): Promise<any[]> {
  try {
    // 1. First try to parse as a specific verse/passage query via bible-api.com
    try {
      const refResponse = await fetch(`${BASE_URL}/${encodeURIComponent(query)}?translation=${translation}`);
      if (refResponse.ok) {
        const data = await refResponse.json();
        if (data.verses && data.verses.length > 0) {
          return data.verses.map((v: any) => ({
            book_name: v.book_name,
            chapter: v.chapter,
            verse: v.verse,
            text: v.text.replace(/<[^>]+>/g, '')
          }));
        }
      }
    } catch (e) {
      console.warn("Reference format failed, trying keyword search", e);
    }

    // 2. If it's not a valid reference or fails, try keyword search via bolls.life
    // Map internal translation IDs to bolls.life compatible ones if necessary
    const bollsTranslation = translation.toUpperCase() === 'WEB' ? 'WEB' : 'KJV';
    
    const searchResponse = await fetch(`https://bolls.life/search/${bollsTranslation}/${encodeURIComponent(query)}/`);
    if (!searchResponse.ok) {
      throw new Error('Search failed');
    }
    const searchData = await searchResponse.json();
    return searchData.map((v: any) => {
      // Find the book name using the 1-indexed book number from bolls.life
      // Bolls life book IDs map standard order: Genesis is 1, Revelation is 66
      const bookIdx = v.book - 1;
      let bookName = 'Unknown Book';
      // Dynamically import BIBLE_BOOKS using standard mapping since we don't import it here directly
      // Or we can just return book number and resolve it in UI, but let's just use a hardcoded lookup or return an object UI can use
      // We will resolve it in UI or use a minimal map here
      const books = [
        "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
        "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job",
        "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea",
        "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
        "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
        "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon",
        "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
      ];
      if (bookIdx >= 0 && bookIdx < books.length) {
        bookName = books[bookIdx];
      }

      return {
        book_name: bookName,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text.replace(/<[^>]+>/g, '') // remove HTML tags like <mark> or <S>
      };
    });
  } catch (error) {
    console.error('Error searching Bible:', error);
    throw error;
  }
}
