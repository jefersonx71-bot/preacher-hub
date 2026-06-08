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

  const lowerSlug = slug.toLowerCase();
  let url = "";

  if (lowerSlug === "ntlh" || lowerSlug === "nvt" || lowerSlug === "naa") {
    // Fetch from damarals/biblias with capitalized filenames
    url = `https://cdn.jsdelivr.net/gh/damarals/biblias@master/inst/json/${lowerSlug.toUpperCase()}.json`;
  } else {
    // Fetch from thiagobodruk/biblia
    url = `https://cdn.jsdelivr.net/gh/thiagobodruk/biblia@master/json/${encodeURIComponent(slug)}.json`;
  }

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

const GLOSSARY: Record<string, string> = {
  "Deus": "Deus [Heb. Elohim H430 / Gr. Theos G2316]",
  "deus": "deus [Gr. theos G2316]",
  "Senhor": "Senhor [Heb. Yahweh H3068 / Gr. Kyrios G2962]",
  "senhor": "senhor [Gr. kyrios G2962]",
  "Jesus": "Jesus [Gr. Iesous G2424]",
  "Cristo": "Cristo [Gr. Christos G5547]",
  "amou": "amou [Gr. agapao G25]",
  "amor": "amor [Gr. agape G26]",
  "mundo": "mundo [Gr. kosmos G2889]",
  "vida": "vida [Gr. zoe G2222]",
  "eterna": "eterna [Gr. aionios G166]",
  "filho": "filho [Gr. huios G5207]",
  "Filho": "Filho [Gr. Huios G5207]",
  "pai": "pai [Gr. pater G3962]",
  "Pai": "Pai [Gr. Pater G3962]",
  "fé": "fé [Gr. pistis G4102]",
  "crer": "crer [Gr. pisteuo G4100]",
  "crê": "crê [Gr. pisteuo G4100]",
  "creem": "creem [Gr. pisteuo G4100]",
  "salvação": "salvação [Gr. soteria G4991]",
  "salvo": "salvo [Gr. sozo G4982]",
  "salva": "salva [Gr. sozo G4982]",
  "Graça": "Graça [Gr. charis G5485]",
  "graça": "graça [Gr. charis G5485]",
  "Verbo": "Verbo [Gr. logos G3056]",
  "Palavra": "Palavra [Gr. logos G3056]",
  "palavra": "palavra [Gr. logos G3056]",
  "princípio": "princípio [Heb. reshith H7225 / Gr. arche G746]",
  "espírito": "espírito [Heb. ruach H7307 / Gr. pneuma G4151]",
  "Espírito": "Espírito [Heb. Ruach H7307 / Gr. Pneuma G4151]",
  "carne": "carne [Heb. basar H1320 / Gr. sarx G4561]",
  "terra": "terra [Heb. eretz H776 / Gr. ge G1093]",
  "céu": "céu [Heb. shamayim H8064 / Gr. ouranos G3772]",
  "céus": "céus [Heb. shamayim H8064 / Gr. ouranos G3772]",
  "luz": "luz [Heb. or H216 / Gr. phos G5457]",
  "trevas": "trevas [Heb. choshek H2822 / Gr. skotos G4655]",
  "verdade": "verdade [Heb. emeth H571 / Gr. aletheia G225]",
  "coração": "coração [Heb. leb H3820 / Gr. kardia G2588]",
  "lei": "lei [Heb. torah H8451 / Gr. nomos G3551]",
  "pecado": "pecado [Heb. chatá H2398 / Gr. hamartia G266]",
  "misericórdia": "misericórdia [Heb. chesed H2617 / Gr. eleos G1656]",
  "aliança": "aliança [Heb. berith H1285 / Gr. diatheke G1242]",
  "igreja": "igreja [Gr. ekklesia G1577]",
  "anjo": "anjo [Heb. malak H4397 / Gr. angelos G32]",
  "anjos": "anjos [Heb. malak H4397 / Gr. angelos G32]"
};

function enrichInterlinear(text: string): string {
  let enriched = text;
  Object.entries(GLOSSARY).forEach(([word, replacement]) => {
    const regex = new RegExp(`(?<=^|[^a-zA-Zá-úÁ-ÚçÇñÑ])${word}(?=$|[^a-zA-Zá-úÁ-ÚçÇñÑ])`, 'g');
    enriched = enriched.replace(regex, replacement);
  });
  return enriched;
}

export const fetchChapter = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<BibleChapterResult> => {
    // Map "interlinear" to "acf" for loading base text
    const translationsToFetch = data.translations.map((t) => t === "interlinear" ? "acf" : t);

    const datasets = await Promise.all(
      translationsToFetch.map((t) => loadDataset(t)),
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
        let processedText = (text ?? "").replace(/\s+/g, " ").trim();
        
        if (translation === "interlinear") {
          processedText = enrichInterlinear(processedText);
        }

        entry[translation] = processedText;
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
