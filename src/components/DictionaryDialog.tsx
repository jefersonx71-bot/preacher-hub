import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Loader2, Search, Sparkles, WifiOff } from "lucide-react";
import { parseBibleReference } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { lookupTerm, type DictionaryEntry } from "@/lib/dictionary.functions";

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

interface DictionaryDialogProps {
  open: boolean;
  term: string | null;
  onOpenChange: (open: boolean) => void;
}

const CACHE_KEY = "pregadynamic-dictionary-cache";

function getCache(): Record<string, DictionaryEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DictionaryEntry>) : {};
  } catch {
    return {};
  }
}

function getCachedEntry(term: string): DictionaryEntry | null {
  const cache = getCache();
  return cache[term.toLowerCase().trim()] ?? null;
}

function setCachedEntry(term: string, entry: DictionaryEntry) {
  const cache = getCache();
  cache[term.toLowerCase().trim()] = entry;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage full
  }
}

export function DictionaryDialog({ open, term, onOpenChange }: DictionaryDialogProps) {
  const lookup = useServerFn(lookupTerm);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const run = useCallback(
    async (raw: string) => {
      const clean = raw.trim();
      if (clean.length < 2) {
        setError("Digite ao menos 2 letras.");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      setFromCache(false);

      const cached = getCachedEntry(clean);
      if (cached) {
        setResult(cached);
        setFromCache(true);
        setLoading(false);
        return;
      }

      try {
        const entry = await lookup({ data: { term: clean } });
        setCachedEntry(clean, entry);
        setResult(entry);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao buscar o termo.");
      } finally {
        setLoading(false);
      }
    },
    [lookup],
  );

  // When opened via tapping a word, prefill and search automatically.
  useEffect(() => {
    if (open && term) {
      setQuery(term);
      run(term);
    }
    if (!open) {
      setResult(null);
      setError(null);
      setFromCache(false);
    }
  }, [open, term, run]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles className="size-5 text-gold" />
            Dicionário inteligente
          </DialogTitle>
          <DialogDescription>
            Buscou um termo ou deu um branco? Pesquise um nome ou palavra e receba um mini estudo na
            hora.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(query);
          }}
          className="flex gap-2"
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex: Abisai, graça, Hebrom..."
            aria-label="Termo para buscar"
            autoFocus
          />
          <Button type="submit" disabled={loading} aria-label="Buscar termo">
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          </Button>
        </form>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {loading && (
          <div className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-gold" />
            Estudando "{query}"...
          </div>
        )}

        {result && !loading && (
          <article className="space-y-4">
            {fromCache && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <WifiOff className="size-3" />
                Disponível offline — salvo localmente
              </div>
            )}
            <div>
              <h3 className="font-display text-2xl font-semibold text-foreground">{result.term}</h3>
              {result.meaning && <p className="mt-1 text-sm italic text-gold">{result.meaning}</p>}
            </div>

            {result.summary && (
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {result.summary}
              </p>
            )}

            {result.references.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.references.map((ref) => {
                  const parsed = parseBibleReference(ref);
                  if (parsed) {
                    return (
                      <Link
                        key={ref}
                        to="/biblia"
                        search={{ book: parsed.book, chapter: parsed.chapter }}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-1 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 active:scale-95"
                      >
                        <BookOpen className="size-3" />
                        {ref}
                      </Link>
                    );
                  }
                  return (
                    <span
                      key={ref}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-1 text-xs font-semibold text-gold"
                    >
                      <BookOpen className="size-3" />
                      {ref}
                    </span>
                  );
                })}
              </div>
            )}

            {result.study && (
              <div className="rounded-2xl border-l-4 border-gold bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  Mini estudo
                </p>
                <p className="mt-2 whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {result.study}
                </p>
              </div>
            )}

            {result.connections && result.connections.length > 0 && (
              <div className="space-y-3 mt-4 border-t border-border/60 pt-4">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="size-3.5 text-gold" /> Conexões &amp; Paralelos de Fé (Mesmo
                  Peso Espiritual)
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {result.connections.map((conn) => {
                    const match = conn.match(/^([^(]+)\s*\(([^)]+)\)$/);
                    const title = match ? match[1].trim() : conn;
                    const desc = match ? match[2].trim() : "";

                    return (
                      <button
                        key={conn}
                        type="button"
                        onClick={() => {
                          const cleanTerm = getCleanSearchTerm(title);
                          setQuery(title);
                          run(cleanTerm);
                        }}
                        className="flex items-start justify-between gap-3 text-left p-3 rounded-xl border border-border/80 bg-card hover:border-gold/50 hover:bg-gold/5 transition-all duration-200 group active:scale-[0.98] shadow-sm w-full"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-xs text-gold group-hover:underline">
                            {title}
                          </span>
                          {desc && (
                            <span className="text-[11px] text-muted-foreground leading-relaxed">
                              {desc}
                            </span>
                          )}
                        </div>
                        <ArrowLeft className="size-3.5 rotate-180 text-gold/40 group-hover:text-gold/80 transition-all shrink-0 mt-0.5 group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        )}
      </DialogContent>
    </Dialog>
  );
}
