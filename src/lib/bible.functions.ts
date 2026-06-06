import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  // English book name as used by bible-api.com (e.g. "John", "1 Corinthians")
  book: z.string().trim().min(2).max(40),
  chapter: z.number().int().min(1).max(150),
  // List of translation ids to fetch in parallel
  translations: z.array(z.string().trim().min(2).max(20)).min(1).max(5),
});

export interface ParallelVerse {
  verse: number;
  /** translationId -> verse text */
  texts: Record<string, string>;
}

export interface BibleChapterResult {
  /** Reference in the first translation's language (e.g. "João 3") */
  reference: string;
  translations: string[];
  verses: ParallelVerse[];
}

interface ApiVerse {
  verse: number;
  text: string;
}
interface ApiResponse {
  reference?: string;
  verses?: ApiVerse[];
}

async function fetchTranslation(
  book: string,
  chapter: number,
  translation: string,
): Promise<ApiResponse | null> {
  const ref = encodeURIComponent(`${book} ${chapter}`);
  const url = `https://bible-api.com/${ref}?translation=${encodeURIComponent(translation)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as ApiResponse;
  } catch {
    return null;
  }
}

export const fetchChapter = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<BibleChapterResult> => {
    const results = await Promise.all(
      data.translations.map((t) => fetchTranslation(data.book, data.chapter, t)),
    );

    // Map: verseNumber -> { translationId: text }
    const byVerse = new Map<number, Record<string, string>>();
    let reference = `${data.book} ${data.chapter}`;

    data.translations.forEach((translation, idx) => {
      const res = results[idx];
      if (!res?.verses) return;
      if (idx === 0 && res.reference) reference = res.reference;
      for (const v of res.verses) {
        const entry = byVerse.get(v.verse) ?? {};
        entry[translation] = (v.text ?? "").replace(/\s+/g, " ").trim();
        byVerse.set(v.verse, entry);
      }
    });

    if (byVerse.size === 0) {
      throw new Error("Não foi possível carregar este capítulo. Tente novamente.");
    }

    const verses: ParallelVerse[] = Array.from(byVerse.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([verse, texts]) => ({ verse, texts }));

    return { reference, translations: data.translations, verses };
  });
