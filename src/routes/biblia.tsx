import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { fetchChapter } from "@/lib/bible.functions";
import {
  BIBLE_BOOKS,
  BIBLE_VERSIONS,
  versionById,
  type BibleBook,
} from "@/lib/bible-books";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const VERSIONS_KEY = "pregadynamic-bible-versions";

export const Route = createFileRoute("/biblia")({
  head: () => ({
    meta: [
      { title: "Bíblia para Estudo — PregaDynamic" },
      {
        name: "description",
        content:
          "Leia a Bíblia em várias versões lado a lado (Almeida, inglês e latim) para estudo e comparação versículo a versículo.",
      },
      { property: "og:title", content: "Bíblia para Estudo — PregaDynamic" },
      {
        property: "og:description",
        content:
          "Compare a Bíblia em vários idiomas lado a lado, versículo a versículo, para enriquecer seu estudo.",
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
      const valid = Array.isArray(parsed)
        ? parsed.filter((id) => VALID_IDS.has(id))
        : [];
      if (valid.length) return valid.slice(0, 4);
    }
  } catch {
    // ignore
  }
  return DEFAULT_VERSIONS;
}

function BiblePage() {
  const fetchFn = useServerFn(fetchChapter);
  const [bookIdx, setBookIdx] = useState(42); // João
  const [chapter, setChapter] = useState(3);
  const [versions, setVersions] = useState<string[]>(() =>
    typeof window === "undefined" ? DEFAULT_VERSIONS : loadVersions(),
  );

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
    queryFn: () =>
      fetchFn({ data: { bookIndex: bookIdx, chapter, translations: versions } }),
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

  return (
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
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6">
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
            <SelectTrigger className="h-11 w-[110px] bg-card font-medium" aria-label="Capítulo">
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

        {/* Version selector */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Versões para comparar (até 4)
          </p>
          <div className="flex flex-wrap gap-2">
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
                <span className="text-muted-foreground">{versionById(id)?.language}</span>
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
                  <p
                    key={id}
                    className="leading-relaxed text-foreground/90"
                  >
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-gold sm:hidden">
                      {versionById(id)?.label}
                    </span>
                    {v.texts[id] ?? (
                      <span className="italic text-muted-foreground">—</span>
                    )}
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Textos de domínio público via bible-api.com.
        </p>
      </main>
    </div>
  );
}
