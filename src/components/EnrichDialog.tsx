import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { BookOpen, Lightbulb, Loader2, Plus, RefreshCw, Sparkles, Users, WifiOff } from "lucide-react";
import { parseBibleReference } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { enrichTopic, type EnrichResult } from "@/lib/enrich.functions";
import type { Sermon, Topic } from "@/lib/sermons";

interface EnrichDialogProps {
  open: boolean;
  sermon: Sermon | null;
  topic: Topic | null;
  onOpenChange: (open: boolean) => void;
  onAddContent?: (text: string) => void;
}

const CACHE_KEY = "pregadynamic-enrich-cache";

function getCache(): Record<string, EnrichResult> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, EnrichResult>) : {};
  } catch {
    return {};
  }
}

function getCachedEntry(key: string): EnrichResult | null {
  return getCache()[key] ?? null;
}

function setCachedEntry(key: string, entry: EnrichResult) {
  const cache = getCache();
  cache[key] = entry;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage full
  }
}

export function EnrichDialog({ open, sermon, topic, onOpenChange, onAddContent }: EnrichDialogProps) {
  const enrich = useServerFn(enrichTopic);
  const [result, setResult] = useState<EnrichResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const run = useCallback(
    async (force: boolean) => {
      if (!topic) return;
      const key = `${sermon?.id ?? "x"}:${topic.id}`;
      setLoading(true);
      setError(null);
      setFromCache(false);
      if (!force) setResult(null);

      if (!force) {
        const cached = getCachedEntry(key);
        if (cached) {
          setResult(cached);
          setFromCache(true);
          setLoading(false);
          return;
        }
      }

      try {
        const entry = await enrich({
          data: {
            sermonTitle: sermon?.title,
            baseVerse: sermon?.baseVerse,
            topicTitle: topic.title,
            topicContent: topic.content,
          },
        });
        // When forcing more, merge unique references; replace illustrations/examples with fresh ideas.
        const merged: EnrichResult = force && result
          ? {
              illustrations: [...result.illustrations, ...entry.illustrations],
              examples: [...result.examples, ...entry.examples],
              references: Array.from(new Set([...result.references, ...entry.references])),
            }
          : entry;
        setCachedEntry(key, merged);
        setResult(merged);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao enriquecer o tópico.");
      } finally {
        setLoading(false);
      }
    },
    [enrich, sermon, topic, result],
  );

  useEffect(() => {
    if (open && topic) {
      run(false);
    }
    if (!open) {
      setResult(null);
      setError(null);
      setFromCache(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topic?.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] gap-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Sparkles className="size-5 text-gold" />
            Enriquecer o tópico
          </DialogTitle>
          <DialogDescription>
            {topic?.title
              ? `Ilustrações, exemplos e referências para "${topic.title}".`
              : "Ilustrações, exemplos e referências para enriquecer o sermão."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        {loading && (
          <div className="flex items-center gap-2 px-1 py-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-gold" />
            Gerando material...
          </div>
        )}

        {result && !loading && (
          <article className="space-y-5">
            {fromCache && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <WifiOff className="size-3" />
                Disponível offline — salvo localmente
              </div>
            )}

            {result.illustrations.length > 0 && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  <Lightbulb className="size-3.5" /> Ilustrações
                </h3>
                <ul className="space-y-2">
                  {result.illustrations.map((item, i) => (
                    <li
                      key={i}
                      className="group relative rounded-2xl border-l-4 border-gold bg-card p-3 pr-10 text-sm leading-relaxed text-foreground/90 transition-all hover:bg-gold/5"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onAddContent?.(item);
                          toast.success("Ilustração adicionada ao sermão!");
                        }}
                        className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-gold/10 hover:bg-gold text-gold hover:text-gold-foreground transition-all duration-200 active:scale-90"
                        title="Adicionar ao sermão"
                      >
                        <Plus className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.examples.length > 0 && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  <Users className="size-3.5" /> Exemplos práticos
                </h3>
                <ul className="space-y-2">
                  {result.examples.map((item, i) => (
                    <li
                      key={i}
                      className="group relative rounded-xl bg-secondary/50 p-3 pr-10 text-sm leading-relaxed text-foreground/90 transition-all hover:bg-secondary"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onAddContent?.(item);
                          toast.success("Exemplo prático adicionado ao sermão!");
                        }}
                        className="absolute bottom-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground transition-all duration-200 active:scale-90"
                        title="Adicionar ao sermão"
                      >
                        <Plus className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.references.length > 0 && (
              <section className="space-y-2">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                  <BookOpen className="size-3.5" /> Referências
                </h3>
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
              </section>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => run(true)}
              disabled={loading}
              className="w-full gap-1.5"
            >
              <RefreshCw className="size-4" /> Gerar mais ideias e referências
            </Button>
          </article>
        )}
      </DialogContent>
    </Dialog>
  );
}
