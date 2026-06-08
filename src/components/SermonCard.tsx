import { Link } from "@tanstack/react-router";
import { BookOpen, List, Pencil, Presentation, Trash2 } from "lucide-react";
import type { Sermon } from "@/lib/sermons";
import { parseBibleReference } from "@/lib/utils";

interface SermonCardProps {
  sermon: Sermon;
  onDelete?: (id: string) => void;
}

export function SermonCard({ sermon, onDelete }: SermonCardProps) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-gold/40">
      <div className="flex flex-wrap items-center gap-1.5">
        {sermon.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-gold/12 px-2.5 py-0.5 text-xs font-medium text-gold"
          >
            {tag}
          </span>
        ))}
      </div>

      <h3 className="mt-3 font-display text-xl font-semibold leading-tight text-foreground text-balance">
        {sermon.title || "Sem título"}
      </h3>

      {sermon.baseVerse && (() => {
        const parsed = parseBibleReference(sermon.baseVerse);
        if (parsed) {
          return (
            <Link
              to="/biblia"
              search={{ book: parsed.book, chapter: parsed.chapter }}
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <BookOpen className="size-3.5" />
              {sermon.baseVerse}
            </Link>
          );
        }
        return (
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-accent">
            <BookOpen className="size-3.5" />
            {sermon.baseVerse}
          </p>
        );
      })()}

      {sermon.theme && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{sermon.theme}</p>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground/80">
        <List className="size-4 text-muted-foreground/60" />
        {sermon.topics.length} {sermon.topics.length === 1 ? "tópico" : "tópicos"}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Link
          to="/pulpito/$id"
          params={{ id: sermon.id }}
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full border border-border/80 bg-secondary/40 px-4 text-sm font-medium text-muted-foreground/90 transition-colors hover:bg-secondary/80 hover:text-foreground active:scale-[0.98]"
        >
          <Presentation className="size-4" />
          Pregando Agora
        </Link>
        <Link
          to="/editor/$id"
          params={{ id: sermon.id }}
          aria-label="Editar esboço"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-secondary/40 text-muted-foreground/90 transition-colors hover:bg-secondary/80 hover:text-foreground active:scale-[0.98]"
        >
          <Pencil className="size-4" />
        </Link>
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Tem certeza que deseja apagar este esboço de pregação?")) {
                onDelete(sermon.id);
              }
            }}
            aria-label="Apagar esboço"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-secondary/40 text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
    </article>
  );
}
