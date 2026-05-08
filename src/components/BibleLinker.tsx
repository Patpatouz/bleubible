import { BIBLE_BOOKS } from "../data/bibleBooks";
import { cn } from "../lib/utils";

interface BibleLinkerProps {
  text: string;
  onNavigate: (bookName: string, chapter: number, verse?: number) => void;
  className?: string;
  linkClassName?: string;
}

export function BibleLinker({ text, onNavigate, className, linkClassName }: BibleLinkerProps) {
  const bookPatterns = BIBLE_BOOKS.flatMap((b) => {
    const patterns = [b.name, b.id];
    if (b.id === "psalms") patterns.push("Psalm");
    return patterns.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }).join("|");
  
  const crossRefRegex = new RegExp(
    `\\b(${bookPatterns})\\s+(\\d+):(\\d+)(?:-\\d+)?\\b`,
    "gi",
  );

  const parts = text.split(crossRefRegex);

  if (parts.length <= 1) {
    return <span className={className}>{text}</span>;
  }

  const result = [];
  let i = 0;
  while (i < parts.length) {
    result.push(parts[i]);
    if (i + 3 < parts.length) {
      const bookName = parts[i + 1];
      const chapterNum = parseInt(parts[i + 2], 10);
      const verseNum = parseInt(parts[i + 3], 10);

      if (bookName) {
        result.push(
          <span
            key={`ref-${i}`}
            role="button"
            tabIndex={0}
            className={cn(
              "text-brand-primary font-bold hover:underline cursor-pointer bg-brand-primary/10 rounded mx-1 px-1 inline-flex transition-colors",
              linkClassName
            )}
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(bookName, chapterNum, verseNum);
            }}
          >
            {bookName} {chapterNum}:{verseNum}
          </span>,
        );
      }
      i += 4;
    } else {
      i++;
    }
  }

  return <span className={className}>{result}</span>;
}
