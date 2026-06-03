import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, BookText, ChevronDown } from "lucide-react";
import { getSermon, type Sermon } from "@/lib/sermons";
import { PulpitTimer } from "@/components/PulpitTimer";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ClickableText } from "@/components/ClickableText";
import { DictionaryDialog } from "@/components/DictionaryDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pulpito/$id")({
  head: () => ({
    meta: [
      { title: "Modo Púlpito — PregaDynamic" },
      {
        name: "description",
        content:
          "Modo Púlpito: leia seu esboço com sumários retráteis, versículo base em destaque e cronômetro durante a pregação.",
      },
      { property: "og:title", content: "Modo Púlpito — PregaDynamic" },
      {
        property: "og:description",
        content:
          "Modo Púlpito: leia seu esboço com sumários retráteis, versículo base em destaque e cronômetro durante a pregação.",
      },
      { property: "og:url", content: "/pulpito" },
    ],
    links: [{ rel: "canonical", href: "/pulpito" }],
  }),
  component: Pulpit,
});

function Pulpit() {
  const { id } = Route.useParams();
  const [sermon, setSermon] = useState<Sermon | null | undefined>(undefined);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [dictOpen, setDictOpen] = useState(false);
  const [dictTerm, setDictTerm] = useState<string | null>(null);

  const studyWord = (word: string) => {
    setDictTerm(word);
    setDictOpen(true);
  };

  const openDictionary = () => {
    setDictTerm(null);
    setDictOpen(true);
  };

  useEffect(() => {
    setSermon(getSermon(id) ?? null);
  }, [id]);

  const toggle = (topicId: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });

  if (sermon === undefined) return <div className="min-h-screen bg-background" />;

  if (sermon === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="font-display text-xl text-foreground">Esboço não encontrado</p>
        <Link to="/" className="text-accent underline-offset-4 hover:underline">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky control bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            aria-label="Voltar ao painel"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <PulpitTimer />
          <button
            type="button"
            onClick={openDictionary}
            aria-label="Abrir dicionário"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-gold"
          >
            <BookText className="size-5" />
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-8">
        {/* Title block */}
        <div className="text-center">
          {sermon.baseVerse && (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-gold/12 px-3 py-1 text-sm font-semibold text-gold">
              <BookOpen className="size-3.5" />
              {sermon.baseVerse}
            </p>
          )}
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-foreground text-balance sm:text-5xl">
            {sermon.title}
          </h1>
          {sermon.theme && (
            <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground text-balance">
              {sermon.theme}
            </p>
          )}
        </div>

        {sermon.introduction && (
          <div className="mt-8 rounded-2xl border-l-4 border-gold bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Introdução</p>
            <ClickableText
              text={sermon.introduction}
              onWord={studyWord}
              className="mt-2 text-lg leading-relaxed text-foreground"
            />
          </div>
        )}

        {/* Collapsible outline */}
        <div className="mt-8 space-y-3">
          {sermon.topics.map((topic) => {
            const isOpen = open.has(topic.id);
            return (
              <div
                key={topic.id}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-card shadow-soft transition-colors",
                  isOpen ? "border-gold/50" : "border-border",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(topic.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="font-display text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                    {topic.title}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-6 shrink-0 text-gold transition-transform duration-300",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                    <ClickableText
                      text={topic.content || "Sem conteúdo detalhado."}
                      onWord={studyWord}
                      className="px-5 pb-5 text-lg leading-relaxed text-foreground/90"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sermon.conclusion && (
          <div className="mt-8 rounded-2xl border-l-4 border-gold bg-card p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Conclusão</p>
            <p className="mt-2 whitespace-pre-wrap text-lg leading-relaxed text-foreground">
              {sermon.conclusion}
            </p>
          </div>
        )}


        <div className="mt-10 flex justify-center gap-3 text-sm">
          <button
            type="button"
            onClick={() => setOpen(new Set(sermon.topics.map((t) => t.id)))}
            className="rounded-full border border-border px-4 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Expandir tudo
          </button>
          <button
            type="button"
            onClick={() => setOpen(new Set())}
            className="rounded-full border border-border px-4 py-2 font-medium text-muted-foreground hover:text-foreground"
          >
            Recolher tudo
          </button>
        </div>
      </main>
    </div>
  );
}
