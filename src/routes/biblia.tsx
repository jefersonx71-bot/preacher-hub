import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Sparkles,
  Cloud,
  CheckCircle,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fetchChapter, type ParallelVerse, type BibleChapterResult } from "@/lib/bible.functions";
import { toast } from "sonner";
import { BIBLE_BOOKS, BIBLE_VERSIONS, versionById, type BibleBook } from "@/lib/bible-books";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, parseBibleReference } from "@/lib/utils";
import { lookupTerm, getMockEntry, type DictionaryEntry } from "@/lib/dictionary.functions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const VERSIONS_KEY = "pregadynamic-bible-versions";

const bibleSearchSchema = z.object({
  book: z.string().optional(),
  chapter: z.coerce.number().optional(),
});

export const Route = createFileRoute("/biblia")({
  validateSearch: (search) => bibleSearchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Bíblia para Estudo — PregaDynamic" },
      {
        name: "description",
        content:
          "Leia a Bíblia em várias versões em português lado a lado (NVI, ACF e Almeida Atualizada) para estudo e comparação versículo a versículo.",
      },
      { property: "og:title", content: "Bíblia para Estudo — PregaDynamic" },
      {
        property: "og:description",
        content:
          "Compare versões da Bíblia em português lado a lado, versículo a versículo, para enriquecer seu estudo e seus sermões.",
      },
      { property: "og:url", content: "/biblia" },
    ],
    links: [{ rel: "canonical", href: "/biblia" }],
  }),
  component: BiblePage,
});

const DEFAULT_VERSIONS = ["nvi", "acf"];
const VALID_IDS = new Set(BIBLE_VERSIONS.map((v) => v.id));

function loadVersions(): string[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const valid = Array.isArray(parsed) ? parsed.filter((id) => VALID_IDS.has(id)) : [];
      if (valid.length) return valid.slice(0, 4);
    }
  } catch {
    // ignore
  }
  return DEFAULT_VERSIONS;
}

function getCleanSearchTerm(title: string): string {
  let term = title.toLowerCase().trim();
  // Remove leading articles
  term = term.replace(/^(o|a|os|as|um|uma)\s+/, "");
  // If term contains "golias" or "gigantes", map to "golias"
  if (term.includes("golias") || term.includes("gigante")) {
    return "golias";
  }
  // If term contains "cova" or "leões" or "leoes", map to "cova dos leoes"
  if (term.includes("cova") || term.includes("leao") || term.includes("leoes")) {
    return "cova dos leoes";
  }
  return term;
}

interface DatasetBook {
  abbrev: string;
  name?: string;
  chapters: string[][];
}

const clientDatasetCache = new Map<string, DatasetBook[]>();

async function loadDatasetClient(slug: string): Promise<DatasetBook[] | null> {
  const cached = clientDatasetCache.get(slug);
  if (cached) return cached;

  const lowerSlug = slug.toLowerCase();
  try {
    const res = await fetch(`/bible-data/${lowerSlug}.json`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = (await res.json()) as DatasetBook[];
    if (Array.isArray(data) && data.length === 66) {
      clientDatasetCache.set(slug, data);
      return data;
    }
  } catch (err) {
    console.error(`Erro ao carregar tradução ${slug} no cliente`, err);
  }
  return null;
}

const GLOSSARY: Record<string, string> = {
  Deus: "Deus [Heb. Elohim H430 / Gr. Theos G2316]",
  deus: "deus [Gr. theos G2316]",
  Senhor: "Senhor [Heb. Yahweh H3068 / Gr. Kyrios G2962]",
  senhor: "senhor [Gr. kyrios G2962]",
  Jesus: "Jesus [Gr. Iesous G2424]",
  Cristo: "Cristo [Gr. Christos G5547]",
  amou: "amou [Gr. agapao G25]",
  amor: "amor [Gr. agape G26]",
  mundo: "mundo [Gr. kosmos G2889]",
  vida: "vida [Gr. zoe G2222]",
  eterna: "eterna [Gr. aionios G166]",
  filho: "filho [Gr. huios G5207]",
  Filho: "Filho [Gr. Huios G5207]",
  pai: "pai [Gr. pater G3962]",
  Pai: "Pai [Gr. Pater G3962]",
  fé: "fé [Gr. pistis G4102]",
  crer: "crer [Gr. pisteuo G4100]",
  crê: "crê [Gr. pisteuo G4100]",
  creem: "creem [Gr. pisteuo G4100]",
  salvação: "salvação [Gr. soteria G4991]",
  salvo: "salvo [Gr. sozo G4982]",
  salva: "salva [Gr. sozo G4982]",
  Graça: "Graça [Gr. charis G5485]",
  graça: "graça [Gr. charis G5485]",
  Verbo: "Verbo [Gr. logos G3056]",
  Palavra: "Palavra [Gr. logos G3056]",
  palavra: "palavra [Gr. logos G3056]",
  princípio: "princípio [Heb. reshith H7225 / Gr. arche G746]",
  espírito: "espírito [Heb. ruach H7307 / Gr. pneuma G4151]",
  Espírito: "Espírito [Heb. Ruach H7307 / Gr. Pneuma G4151]",
  carne: "carne [Heb. basar H1320 / Gr. sarx G4561]",
  terra: "terra [Heb. eretz H776 / Gr. ge G1093]",
  ceu: "céu [Heb. shamayim H8064 / Gr. ouranos G3772]",
  céus: "céus [Heb. shamayim H8064 / Gr. ouranos G3772]",
  luz: "luz [Heb. or H216 / Gr. phos G5457]",
  trevas: "trevas [Heb. choshek H2822 / Gr. skotos G4655]",
  verdade: "verdade [Heb. emeth H571 / Gr. aletheia G225]",
  coração: "coração [Heb. leb H3820 / Gr. kardia G2588]",
  lei: "lei [Heb. torah H8451 / Gr. nomos G3551]",
  pecado: "pecado [Heb. chatá H2398 / Gr. hamartia G266]",
  misericórdia: "misericórdia [Heb. chesed H2617 / Gr. eleos G1656]",
  aliança: "aliança [Heb. berith H1285 / Gr. diatheke G1242]",
  igreja: "igreja [Gr. ekklesia G1577]",
  anjo: "anjo [Heb. malak H4397 / Gr. angelos G32]",
  anjos: "anjos [Heb. malak H4397 / Gr. angelos G32]",
};

function enrichInterlinearClient(text: string): string {
  let enriched = text;
  Object.entries(GLOSSARY).forEach(([word, replacement]) => {
    const regex = new RegExp(`(?<=^|[^a-zA-Zá-úÁ-ÚçÇñÑ])${word}(?=$|[^a-zA-Zá-úÁ-ÚçÇñÑ])`, "g");
    enriched = enriched.replace(regex, replacement);
  });
  return enriched;
}

async function fetchChapterOffline(
  bookIndex: number,
  chapter: number,
  translations: string[],
): Promise<BibleChapterResult> {
  const translationsToFetch = translations.map((t) => (t === "interlinear" ? "acf" : t));

  const datasets = await Promise.all(translationsToFetch.map((t) => loadDatasetClient(t)));

  const byVerse = new Map<number, Record<string, string>>();

  translations.forEach((translation, idx) => {
    const ds = datasets[idx];
    const book = ds?.[bookIndex];
    const verses = book?.chapters?.[chapter - 1];
    if (!verses) return;
    verses.forEach((text, vi) => {
      const verse = vi + 1;
      const entry = byVerse.get(verse) ?? {};
      let processedText = (text ?? "").replace(/\s+/g, " ").trim();

      if (translation === "interlinear") {
        processedText = enrichInterlinearClient(processedText);
      }

      entry[translation] = processedText;
      byVerse.set(verse, entry);
    });
  });

  if (byVerse.size === 0) {
    throw new Error(
      "Não foi possível carregar este capítulo offline. Certifique-se de que a tradução foi baixada.",
    );
  }

  const verses: ParallelVerse[] = Array.from(byVerse.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([verse, texts]) => ({ verse, texts }));

  return { translations, verses };
}

function BiblePage() {
  const search = Route.useSearch();
  const fetchFn = useServerFn(fetchChapter);

  const initialBookIdx = useMemo(() => {
    if (search.book) {
      const idx = BIBLE_BOOKS.findIndex(
        (b) =>
          b.name.toLowerCase() === search.book?.toLowerCase() ||
          b.query.toLowerCase() === search.book?.toLowerCase() ||
          (search.book?.toLowerCase() === "salmo" && b.name.toLowerCase() === "salmos"),
      );
      if (idx !== -1) return idx;
    }
    return 42; // João
  }, [search.book]);

  const initialChapter = useMemo(() => {
    if (search.chapter) {
      const bookObj = BIBLE_BOOKS[initialBookIdx];
      if (search.chapter >= 1 && search.chapter <= bookObj.chapters) {
        return search.chapter;
      }
    }
    return 3; // João 3
  }, [search.chapter, initialBookIdx]);

  const [bookIdx, setBookIdx] = useState(initialBookIdx);
  const [chapter, setChapter] = useState(initialChapter);
  const [versions, setVersions] = useState<string[]>(() =>
    typeof window === "undefined" ? DEFAULT_VERSIONS : loadVersions(),
  );

  const [activeTab, setActiveTab] = useState("versions");

  const [cachedVersions, setCachedVersions] = useState<Record<string, boolean>>({});
  const [downloadingVersion, setDownloadingVersion] = useState<string | null>(null);

  const checkCacheStatus = async () => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const status: Record<string, boolean> = {};
    try {
      const cache = await caches.open("pregadynamic-cache-v1");
      const requests = await cache.keys();
      const cachedPaths = new Set(
        requests
          .map((r) => {
            try {
              return new URL(r.url, window.location.origin).pathname;
            } catch {
              return "";
            }
          })
          .filter(Boolean),
      );

      for (const v of BIBLE_VERSIONS) {
        const idToCheck = v.id === "interlinear" ? "acf" : v.id;
        const targetPath = `/bible-data/${idToCheck}.json`;
        status[v.id] = cachedPaths.has(targetPath);
      }
    } catch (err) {
      console.error("Erro ao verificar cache offline:", err);
      // Fallback
      for (const v of BIBLE_VERSIONS) {
        if (v.id === "interlinear") {
          const hasAcf = await caches.match("/bible-data/acf.json");
          status[v.id] = !!hasAcf;
        } else {
          const cacheResponse = await caches.match(`/bible-data/${v.id}.json`);
          status[v.id] = !!cacheResponse;
        }
      }
    }
    setCachedVersions(status);
  };

  const downloadVersion = async (versionId: string) => {
    if (typeof window === "undefined" || !("caches" in window)) return;
    const idToFetch = versionId === "interlinear" ? "acf" : versionId;
    setDownloadingVersion(versionId);
    try {
      const cache = await caches.open("pregadynamic-cache-v1");
      await cache.add(`/bible-data/${idToFetch}.json`);
      toast.success(`Bíblia (${versionId.toUpperCase()}) baixada para uso 100% offline!`);
      await checkCacheStatus();
    } catch (err) {
      console.error(err);
      toast.error(`Erro ao baixar tradução: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setDownloadingVersion(null);
    }
  };

  useEffect(() => {
    checkCacheStatus();
  }, []);

  // Abas de estudo de personagens
  const [studyQuery, setStudyQuery] = useState("");
  const [studyResult, setStudyResult] = useState<DictionaryEntry | null>(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [studyError, setStudyError] = useState<string | null>(null);

  const lookup = useServerFn(lookupTerm);

  const handleStudySearch = async (term: string) => {
    const clean = term.trim();
    if (clean.length < 2) {
      setStudyError("Digite ao menos 2 letras.");
      return;
    }
    setStudyLoading(true);
    setStudyError(null);
    setStudyResult(null);

    try {
      const entry = await lookup({ data: { term: clean } });
      setStudyResult(entry);
    } catch (e) {
      console.warn("Falha na busca online, tentando banco de dados local...", e);
      try {
        const localEntry = getMockEntry(clean);
        setStudyResult(localEntry);
      } catch (err) {
        setStudyError(e instanceof Error ? e.message : "Erro ao buscar o personagem ou termo.");
      }
    } finally {
      setStudyLoading(false);
    }
  };

  const handleReferenceClick = (refStr: string) => {
    const parsed = parseBibleReference(refStr);
    if (parsed) {
      const idx = BIBLE_BOOKS.findIndex(
        (b) =>
          b.name.toLowerCase() === parsed.book.toLowerCase() ||
          b.query.toLowerCase() === parsed.book.toLowerCase() ||
          (parsed.book.toLowerCase() === "salmo" && b.name.toLowerCase() === "salmos"),
      );
      if (idx !== -1) {
        setBookIdx(idx);
        setChapter(parsed.chapter);
        setActiveTab("versions");
      }
    }
  };

  useEffect(() => {
    setBookIdx(initialBookIdx);
    setChapter(initialChapter);
  }, [initialBookIdx, initialChapter]);

  const book: BibleBook = BIBLE_BOOKS[bookIdx];

  const setVersionsPersist = (next: string[]) => {
    setVersions(next);
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const toggleVersion = (id: string) => {
    if (versions.includes(id)) {
      if (versions.length === 1) return; // keep at least one
      setVersionsPersist(versions.filter((v) => v !== id));
    } else {
      if (versions.length >= 4) return; // cap at 4 columns
      setVersionsPersist([...versions, id]);
    }
  };

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["bible", bookIdx, chapter, versions.join(",")],
    queryFn: async () => {
      try {
        return await fetchFn({ data: { bookIndex: bookIdx, chapter, translations: versions } });
      } catch (err) {
        console.warn("Falha ao buscar capítulo do servidor, tentando modo offline...", err);
        return await fetchChapterOffline(bookIdx, chapter, versions);
      }
    },
    staleTime: 1000 * 60 * 60,
  });

  const chapters = useMemo(
    () => Array.from({ length: book.chapters }, (_, i) => i + 1),
    [book.chapters],
  );

  const goChapter = (delta: number) => {
    const next = chapter + delta;
    if (next >= 1 && next <= book.chapters) setChapter(next);
  };

  const onBookChange = (value: string) => {
    setBookIdx(Number(value));
    setChapter(1);
  };

  const hasAnyCached = Object.values(cachedVersions).some(Boolean);

  return (
    <Dialog>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Link
              to="/"
              aria-label="Voltar ao painel"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <p className="flex items-center gap-1.5 font-display text-lg font-semibold text-foreground">
              <BookOpen className="size-5 text-gold" />
              Bíblia
            </p>
            <div className="flex items-center gap-2">
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5 rounded-lg text-xs font-semibold border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer relative",
                    hasAnyCached &&
                      "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
                  )}
                >
                  <Cloud className="size-4" />
                  <span>Baixar Bíblia</span>
                </Button>
              </DialogTrigger>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6">
          {!hasAnyCached && typeof navigator !== "undefined" && navigator.onLine && (
            <div className="mb-6 rounded-xl border border-gold/20 bg-gold/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex gap-2.5 items-start">
                <Cloud className="size-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Leitura 100% Offline no Púlpito
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Você ainda não baixou nenhuma tradução bíblica para uso offline. Baixe agora
                    para ler no púlpito mesmo sem sinal de internet.
                  </p>
                </div>
              </div>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-gold text-gold-foreground font-semibold shrink-0 hover:bg-gold/90 h-9 rounded-lg px-4 cursor-pointer text-xs"
                >
                  Escolher Versões
                </Button>
              </DialogTrigger>
            </div>
          )}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-card border border-border/60 p-1 rounded-xl mb-6">
              <TabsTrigger
                value="versions"
                className="rounded-lg py-2 font-medium text-sm data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground transition-all"
              >
                Texto &amp; Versões
              </TabsTrigger>
              <TabsTrigger
                value="study"
                className="rounded-lg py-2 font-medium text-sm data-[state=active]:bg-secondary data-[state=active]:text-foreground text-muted-foreground transition-all"
              >
                Estudo de Personagens
              </TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="space-y-6">
              {/* Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                <Select value={String(bookIdx)} onValueChange={onBookChange}>
                  <SelectTrigger className="h-11 w-[200px] bg-card font-medium" aria-label="Livro">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[60vh]">
                    <SelectGroup>
                      <SelectLabel>Antigo Testamento</SelectLabel>
                      {BIBLE_BOOKS.map((b, i) =>
                        b.testament === "AT" ? (
                          <SelectItem key={b.query} value={String(i)}>
                            {b.name}
                          </SelectItem>
                        ) : null,
                      )}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Novo Testamento</SelectLabel>
                      {BIBLE_BOOKS.map((b, i) =>
                        b.testament === "NT" ? (
                          <SelectItem key={b.query} value={String(i)}>
                            {b.name}
                          </SelectItem>
                        ) : null,
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select value={String(chapter)} onValueChange={(v) => setChapter(Number(v))}>
                  <SelectTrigger
                    className="h-11 w-[110px] bg-card font-medium"
                    aria-label="Capítulo"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[60vh]">
                    {chapters.map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        Cap. {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => goChapter(-1)}
                    disabled={chapter <= 1}
                    aria-label="Capítulo anterior"
                    className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goChapter(1)}
                    disabled={chapter >= book.chapters}
                    aria-label="Próximo capítulo"
                    className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>

              {/* Reference */}
              <h1 className="mt-6 font-display text-2xl font-semibold text-foreground">
                {book.name} {chapter}
              </h1>

              {/* Column headers (parallel) */}
              {versions.length > 1 && (
                <div
                  className="mt-4 hidden gap-4 border-b border-border pb-2 sm:grid"
                  style={{ gridTemplateColumns: `2.5rem repeat(${versions.length}, 1fr)` }}
                >
                  <span />
                  {versions.map((id) => (
                    <span
                      key={id}
                      className="text-xs font-semibold uppercase tracking-wide text-gold"
                    >
                      {versionById(id)?.label}{" "}
                      <span className="text-muted-foreground">{versionById(id)?.fullName}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* States */}
              {isFetching && (
                <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-gold" />
                  Carregando {book.name} {chapter}...
                </div>
              )}

              {isError && !isFetching && (
                <div className="mt-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error instanceof Error ? error.message : "Erro ao carregar."}{" "}
                  <button onClick={() => refetch()} className="font-semibold underline">
                    Tentar novamente
                  </button>
                </div>
              )}

              {data && !isFetching && (
                <div className="mt-3 divide-y divide-border/60">
                  {data.verses.map((v) => (
                    <div
                      key={v.verse}
                      className="grid gap-x-4 gap-y-1 py-3 sm:gap-4"
                      style={{
                        gridTemplateColumns:
                          versions.length > 1
                            ? `2.5rem repeat(${versions.length}, 1fr)`
                            : "2.5rem 1fr",
                      }}
                    >
                      <span className="select-none pt-0.5 text-sm font-bold text-gold">
                        {v.verse}
                      </span>
                      {versions.map((id) => (
                        <p key={id} className="leading-relaxed text-foreground/90">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gold sm:hidden">
                            {versionById(id)?.label}
                          </span>
                          {v.texts[id] ?? <span className="italic text-muted-foreground">—</span>}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-10 text-center text-xs text-muted-foreground">
                Textos bíblicos em português para estudo e comparação.
              </p>

              {/* Version selector - Movido para baixo */}
              <div className="mt-8 flex flex-col items-center justify-center text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Versões em português para comparar (até 4)
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                  {BIBLE_VERSIONS.map((v) => {
                    const active = versions.includes(v.id);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleVersion(v.id)}
                        className={cn(
                          "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                          active
                            ? "border-transparent bg-gold text-gold-foreground"
                            : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {v.label}
                        <span className="ml-1.5 text-xs opacity-70">{v.fullName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gerenciar Modo Offline - Movido para o final da página */}
              <details className="mt-8 mb-8 rounded-xl border border-border bg-card/50 group">
                <summary className="flex items-center justify-between p-4 cursor-pointer list-none outline-none">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-foreground flex items-center gap-1.5">
                    <BookOpen className="size-4 text-gold" /> Uso Offline da Bíblia
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">
                      {typeof navigator !== "undefined" && navigator.onLine
                        ? "Online"
                        : "Modo Offline"}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </div>
                </summary>
                <div className="p-4 pt-0 space-y-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Baixe as traduções abaixo para que a leitura e comparação versículo a versículo
                    funcionem no púlpito mesmo sem internet.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {BIBLE_VERSIONS.map((v) => {
                      const isCached = cachedVersions[v.id];
                      const isDownloading = downloadingVersion === v.id;

                      return (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-background/50 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-foreground uppercase">
                              {v.label}
                            </span>
                            <span className="text-muted-foreground ml-1.5">({v.fullName})</span>
                          </div>

                          {isCached ? (
                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Salvo Offline
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => downloadVersion(v.id)}
                              disabled={isDownloading}
                              className="font-semibold text-gold hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              {isDownloading ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                "Baixar"
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </details>
            </TabsContent>

            <TabsContent value="study" className="space-y-6">
              <div className="mx-auto max-w-2xl">
                <h2 className="font-display text-2xl font-semibold text-foreground text-center mb-1">
                  Estudo de Personagens, Conceitos e Lugares
                </h2>
                <p className="text-sm text-muted-foreground text-center mb-6">
                  Pesquise qualquer personagem ou tema teológico e veja o mini estudo instantâneo.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleStudySearch(studyQuery);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={studyQuery}
                      onChange={(e) => setStudyQuery(e.target.value)}
                      placeholder="Ex: Moisés, Abisai, Graça, Hebrom, Fé..."
                      className="flex h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={studyLoading}
                    className="h-11 rounded-xl bg-gold text-gold-foreground font-semibold px-6 hover:bg-gold/90 transition-colors"
                  >
                    {studyLoading ? <Loader2 className="size-4 animate-spin" /> : "Estudar"}
                  </Button>
                </form>

                {/* Sugestões rápidas */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center items-center">
                  <span className="text-xs text-muted-foreground mr-1">Sugestões:</span>
                  {[
                    "Moisés",
                    "Davi",
                    "Abisai",
                    "Elias",
                    "Paulo",
                    "Pedro",
                    "Graça",
                    "Fé",
                    "Hebrom",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setStudyQuery(t);
                        handleStudySearch(t);
                      }}
                      className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {studyError && (
                  <p className="mt-6 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {studyError}
                  </p>
                )}

                {studyLoading && (
                  <div className="mt-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin text-gold" />
                    <p className="text-sm">Buscando informações e estruturando estudo...</p>
                  </div>
                )}

                {studyResult && !studyLoading && (
                  <article className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
                    <div>
                      <h3 className="font-display text-3xl font-bold text-foreground">
                        {studyResult.term}
                      </h3>
                      {studyResult.meaning && (
                        <p className="mt-1 text-sm italic text-gold font-medium">
                          {studyResult.meaning}
                        </p>
                      )}
                    </div>

                    {studyResult.summary && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Contexto Bíblico
                        </h4>
                        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90 text-sm">
                          {studyResult.summary}
                        </p>
                      </div>
                    )}

                    {studyResult.references.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Passagens Chave (Clique para Ler)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {studyResult.references.map((ref) => (
                            <button
                              key={ref}
                              type="button"
                              onClick={() => handleReferenceClick(ref)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-1 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 active:scale-95"
                            >
                              <BookOpen className="size-3" />
                              {ref}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {studyResult.study && (
                      <div className="rounded-xl border-l-4 border-gold bg-secondary/30 p-4 mt-4">
                        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold">
                          <Sparkles className="size-3.5" /> Mini Estudo &amp; Lição Homilética
                        </h4>
                        <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground/90 text-sm">
                          {studyResult.study}
                        </p>
                      </div>
                    )}

                    {studyResult.connections && studyResult.connections.length > 0 && (
                      <div className="space-y-3 mt-6 border-t border-border/60 pt-6">
                        <div>
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            <Sparkles className="size-3.5 text-gold" /> Conexões &amp; Paralelos de
                            Fé (Mesmo Peso Espiritual)
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Histórias bíblicas com a mesma verdade teológica: tribulações e lutas
                            que Deus usa para aperfeiçoar o nosso caráter.
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {studyResult.connections.map((conn) => {
                            const match = conn.match(/^([^(]+)\s*\(([^)]+)\)$/);
                            const title = match ? match[1].trim() : conn;
                            const desc = match ? match[2].trim() : "";

                            return (
                              <button
                                key={conn}
                                type="button"
                                onClick={() => {
                                  const cleanTerm = getCleanSearchTerm(title);
                                  setStudyQuery(title);
                                  handleStudySearch(cleanTerm);
                                }}
                                className="flex items-start justify-between gap-3 text-left p-4 rounded-xl border border-border/80 bg-card hover:border-gold/50 hover:bg-gold/5 transition-all duration-200 group active:scale-[0.98] shadow-sm hover:shadow-md w-full"
                              >
                                <div className="flex flex-col gap-1">
                                  <span className="font-semibold text-sm text-gold group-hover:underline">
                                    {title}
                                  </span>
                                  {desc && (
                                    <span className="text-xs text-muted-foreground leading-relaxed">
                                      {desc}
                                    </span>
                                  )}
                                </div>
                                <ArrowLeft className="size-4 rotate-180 text-gold/40 group-hover:text-gold/80 transition-all shrink-0 mt-0.5 group-hover:translate-x-0.5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <DialogContent className="sm:max-w-[480px] rounded-2xl border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <Cloud className="size-5 text-gold" /> Uso Offline da Bíblia
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Baixe as traduções para que a leitura e comparação versículo a versículo funcionem no
              púlpito mesmo sem nenhuma conexão à internet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {BIBLE_VERSIONS.map((v) => {
              const isCached = cachedVersions[v.id];
              const isDownloading = downloadingVersion === v.id;

              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/40 text-sm hover:bg-background/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground uppercase text-xs">{v.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">({v.fullName})</span>
                  </div>

                  {isCached ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                      <CheckCircle className="size-3" /> Salvo Offline
                    </span>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadVersion(v.id)}
                      disabled={isDownloading}
                      className="h-8 text-xs font-semibold px-4 rounded-lg bg-gold/15 text-gold hover:bg-gold/25 cursor-pointer disabled:opacity-50"
                    >
                      {isDownloading ? <Loader2 className="size-3.5 animate-spin" /> : "Baixar"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </div>
    </Dialog>
  );
}
