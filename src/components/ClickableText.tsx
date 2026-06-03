import { cn } from "@/lib/utils";

interface ClickableTextProps {
  text: string;
  onWord: (word: string) => void;
  className?: string;
}

// Strips surrounding punctuation so "Abisai," looks up "Abisai".
function cleanWord(token: string) {
  return token.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

/**
 * Renders text where every word is tappable to open a dictionary mini study.
 * Whitespace (including line breaks) is preserved via whitespace-pre-wrap.
 */
export function ClickableText({ text, onWord, className }: ClickableTextProps) {
  const tokens = text.split(/(\s+)/);

  return (
    <p className={cn("whitespace-pre-wrap", className)}>
      {tokens.map((token, i) => {
        if (token === "" || /^\s+$/.test(token)) {
          return <span key={i}>{token}</span>;
        }
        const clean = cleanWord(token);
        if (!clean) {
          return <span key={i}>{token}</span>;
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onWord(clean)}
            title={`Estudar "${clean}"`}
            className="cursor-pointer rounded px-0.5 text-left transition-colors hover:bg-gold/15 hover:text-gold focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            {token}
          </button>
        );
      })}
    </p>
  );
}
