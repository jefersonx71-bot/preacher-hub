import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Plus, Search, Sparkles, Wand2 } from "lucide-react";
import { useSermons } from "@/lib/sermons";
import { SermonCard } from "@/components/SermonCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PregaDynamic — Seus Esboços" },
      {
        name: "description",
        content:
          "Painel com todos os seus esboços de pregação, busca rápida e o Modo Púlpito para pregar com sumários retráteis.",
      },
      { property: "og:title", content: "PregaDynamic — Seus Esboços" },
      {
        property: "og:description",
        content:
          "Painel com todos os seus esboços de pregação, busca rápida e o Modo Púlpito para pregar com sumários retráteis.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { sermons, deleteSermon } = useSermons();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons
      .filter((s) =>
        q
          ? s.title.toLowerCase().includes(q) || s.baseVerse.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [sermons, query]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-6 sm:pt-10">
        {/* Header */}
        <header className="flex items-start justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              <Sparkles className="size-3.5" /> PregaDynamic
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Seus Esboços
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Search */}
        <div className="relative mt-6">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título ou versículo..."
            aria-label="Buscar esboços por título ou versículo"
            className="h-12 rounded-xl border-border bg-card pl-10 text-base shadow-soft"
          />
        </div>

        {/* AI import banner */}
        <Link
          to="/importar"
          className="mt-4 flex items-center gap-3 rounded-xl border border-gold/20 bg-card p-4 transition-colors hover:bg-secondary/35 hover:border-gold/30"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 border border-gold/20 text-gold">
            <Wand2 className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-semibold text-foreground">
              Gerar esboço com IA
            </span>
            <span className="block text-sm text-muted-foreground">
              Cole sua pregação do Google Docs e transforme em esboço inteligente
            </span>
          </span>
        </Link>

        {/* Bible study link */}
        <Link
          to="/biblia"
          className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/35"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <BookOpen className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-semibold text-foreground">
              Bíblia para estudo
            </span>
            <span className="block text-sm text-muted-foreground">
              Leia em várias versões lado a lado, versículo a versículo
            </span>
          </span>
        </Link>



        {/* List */}
        <h2 className="mt-6 font-display text-lg font-semibold text-foreground">
          Esboços salvos
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {filtered.map((sermon) => (
            <SermonCard key={sermon.id} sermon={sermon} onDelete={deleteSermon} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 text-center">
            <p className="font-display text-lg text-foreground">Nenhum esboço encontrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste a busca ou crie um novo esboço.
            </p>
          </div>
        )}
      </main>

      {/* Floating create button */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-6">
        <Link
          to="/editor/$id"
          params={{ id: "new" }}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-semibold text-gold-foreground shadow-gold transition-transform active:scale-95"
        >
          <Plus className="size-5" />
          Criar Novo Esboço
        </Link>
      </div>
    </div>
  );
}
