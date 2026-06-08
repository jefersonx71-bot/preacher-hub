import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  // Canonical book index 0-65 (matches BIBLE_BOOKS order)
  bookIndex: z.number().int().min(0).max(65),
  chapter: z.number().int().min(1).max(150),
  // List of version ids (dataset slugs) to fetch in parallel
  translations: z.array(z.string().trim().min(2).max(20)).min(1).max(5),
});

export interface ParallelVerse {
  verse: number;
  /** versionId -> verse text */
  texts: Record<string, string>;
}

export interface BibleChapterResult {
  translations: string[];
  verses: ParallelVerse[];
}

interface DatasetBook {
  abbrev: string;
  name: string;
  chapters: string[][];
}

// In-memory cache per worker isolate (datasets are ~4MB each, fetched once).
const datasetCache = new Map<string, DatasetBook[]>();

async function loadDataset(slug: string): Promise<DatasetBook[] | null> {
  const cached = datasetCache.get(slug);
  if (cached) return cached;
  const url = `https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/${encodeURIComponent(slug)}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    let text = await res.text();
    // Strip UTF-8 BOM if present
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    const data = JSON.parse(text) as DatasetBook[];
    if (!Array.isArray(data) || data.length !== 66) return null;
    datasetCache.set(slug, data);
    return data;
  } catch {
    return null;
  }
}

export const fetchChapter = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<BibleChapterResult> => {
    const datasets = await Promise.all(
      data.translations.map((t) => loadDataset(t)),
    );

    // Map: verseNumber -> { versionId: text }
    const byVerse = new Map<number, Record<string, string>>();

    data.translations.forEach((translation, idx) => {
      const ds = datasets[idx];
      const book = ds?.[data.bookIndex];
      const verses = book?.chapters?.[data.chapter - 1];
      if (!verses) return;
      verses.forEach((text, vi) => {
        const verse = vi + 1;
        const entry = byVerse.get(verse) ?? {};
        entry[translation] = (text ?? "").replace(/\s+/g, " ").trim();
        byVerse.set(verse, entry);
      });
    });

    if (byVerse.size === 0) {
      throw new Error("Não foi possível carregar este capítulo. Tente novamente.");
    }

    const verses: ParallelVerse[] = Array.from(byVerse.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([verse, texts]) => ({ verse, texts }));

    return { translations: data.translations, verses };
  });
