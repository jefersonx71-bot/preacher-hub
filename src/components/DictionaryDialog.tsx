import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Loader2, Search, Sparkles } from "lucide-react";
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

interface DictionaryDialogProps {
  open: boolean;
  term: string | null;
  onOpenChange: (open: boolean) => void;
}

export function DictionaryDialog({ open, term, onOpenChange }: DictionaryDialogProps) {
  const lookup = useServerFn(lookupTerm);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      try {
        const entry = await lookup({ data: { term: clean } });
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
            Buscou um termo ou deu um branco? Pesquise um nome ou palavra e receba um mini estudo na hora.
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
            <div>
              <h3 className="font-display text-2xl font-semibold text-foreground">{result.term}</h3>
              {result.meaning && (
                <p className="mt-1 text-sm italic text-gold">{result.meaning}</p>
              )}
            </div>

            {result.summary && (
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                {result.summary}
              </p>
            )}

            {result.references.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.references.map((ref) => (
                  <span
                    key={ref}
                    className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-1 text-xs font-semibold text-gold"
                  >
                    <BookOpen className="size-3" />
                    {ref}
                  </span>
                ))}
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
          </article>
        )}
      </DialogContent>
    </Dialog>
  );
}
