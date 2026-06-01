import { Link } from "@tanstack/react-router";
import { BookOpen, ListTree, Pencil, Presentation } from "lucide-react";
import type { Sermon } from "@/lib/sermons";

export function SermonCard({ sermon }: { sermon: Sermon }) {
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

      {sermon.baseVerse && (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-accent">
          <BookOpen className="size-3.5" />
          {sermon.baseVerse}
        </p>
      )}

      {sermon.theme && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{sermon.theme}</p>
      )}

      <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ListTree className="size-3.5" />
        {sermon.topics.length} {sermon.topics.length === 1 ? "tópico" : "tópicos"}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Link
          to="/pulpito/$id"
          params={{ id: sermon.id }}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-hero px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.98]"
        >
          <Presentation className="size-4" />
          Pregando Agora
        </Link>
        <Link
          to="/editor/$id"
          params={{ id: sermon.id }}
          aria-label="Editar esboço"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Pencil className="size-4" />
        </Link>
      </div>
    </article>
  );
}
