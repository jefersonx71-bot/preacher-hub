import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Check, Plus, Presentation } from "lucide-react";
import {
  ALL_TAGS,
  emptySermon,
  getSermon,
  uid,
  useSermons,
  type Sermon,
  type Topic,
} from "@/lib/sermons";
import { SortableTopic } from "@/components/SortableTopic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/editor/$id")({
  head: () => ({
    meta: [
      { title: "Editor de Esboço — PregaDynamic" },
      {
        name: "description",
        content:
          "Edite título, versículo base, introdução, categorias e tópicos do seu esboço de pregação, com tópicos reordenáveis.",
      },
      { property: "og:title", content: "Editor de Esboço — PregaDynamic" },
      {
        property: "og:description",
        content:
          "Edite título, versículo base, introdução, categorias e tópicos do seu esboço de pregação, com tópicos reordenáveis.",
      },
      { property: "og:url", content: "/editor" },
    ],
    links: [{ rel: "canonical", href: "/editor" }],
  }),
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const { saveSermon } = useSermons();
  const [sermon, setSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    if (id === "new") {
      setSermon(emptySermon());
    } else {
      setSermon(getSermon(id) ?? emptySermon());
    }
  }, [id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!sermon) {
    return <div className="min-h-screen bg-background" />;
  }

  const set = (patch: Partial<Sermon>) => setSermon((s) => (s ? { ...s, ...patch } : s));

  const updateTopic = (topicId: string, patch: Partial<Topic>) =>
    set({ topics: sermon.topics.map((t) => (t.id === topicId ? { ...t, ...patch } : t)) });

  const removeTopic = (topicId: string) =>
    set({ topics: sermon.topics.filter((t) => t.id !== topicId) });

  const addTopic = () =>
    set({
      topics: [
        ...sermon.topics,
        { id: uid(), title: `Tópico ${sermon.topics.length + 1}`, content: "" },
      ],
    });

  const toggleTag = (tag: string) =>
    set({
      tags: sermon.tags.includes(tag)
        ? sermon.tags.filter((t) => t !== tag)
        : [...sermon.tags, tag],
    });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sermon.topics.findIndex((t) => t.id === active.id);
      const newIndex = sermon.topics.findIndex((t) => t.id === over.id);
      set({ topics: arrayMove(sermon.topics, oldIndex, newIndex) });
    }
  };

  const handleSave = () => {
    saveSermon(sermon);
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => router.history.back()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </button>
          <div className="flex items-center gap-2">
            {id !== "new" && (
              <Link
                to="/pulpito/$id"
                params={{ id: sermon.id }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                <Presentation className="size-4" /> Púlpito
              </Link>
            )}
            <Button onClick={handleSave} className="gap-1.5">
              <Check className="size-4" /> Salvar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {id === "new" ? "Novo Esboço" : "Editar Esboço"}
        </h1>
        {/* Core fields */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <Field label="Título do Sermão" htmlFor="sermon-title">
            <Input
              id="sermon-title"
              value={sermon.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Ex: A Âncora da Alma"
              className="h-11 font-display text-lg"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Versículo Base" htmlFor="sermon-verse">
              <Input
                id="sermon-verse"
                value={sermon.baseVerse}
                onChange={(e) => set({ baseVerse: e.target.value })}
                placeholder="Ex: Hebreus 6:19"
              />
            </Field>
            <Field label="Tema Principal" htmlFor="sermon-theme">
              <Input
                id="sermon-theme"
                value={sermon.theme}
                onChange={(e) => set({ theme: e.target.value })}
                placeholder="A ideia central da mensagem"
              />
            </Field>
          </div>
          <Field label="Introdução" htmlFor="sermon-intro">
            <Textarea
              id="sermon-intro"
              value={sermon.introduction}
              onChange={(e) => set({ introduction: e.target.value })}
              placeholder="Como você vai abrir a mensagem..."
              className="min-h-28"
            />
          </Field>
          <Field label="Categorias">
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    sermon.tags.includes(tag)
                      ? "border-transparent bg-gold/15 text-gold"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Topics / Desenvolvimento */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Desenvolvimento</h2>
              <p className="text-xs text-muted-foreground">Os pontos centrais da mensagem</p>
            </div>
            <span className="text-xs text-muted-foreground">Arraste para reordenar</span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sermon.topics.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {sermon.topics.map((topic, index) => (
                  <SortableTopic
                    key={topic.id}
                    topic={topic}
                    index={index}
                    onChange={(patch) => updateTopic(topic.id, patch)}
                    onRemove={() => removeTopic(topic.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button
            type="button"
            variant="outline"
            onClick={addTopic}
            className="mt-3 w-full gap-1.5 border-dashed py-5"
          >
            <Plus className="size-4" /> Adicionar Ponto
          </Button>
        </div>

        {/* Conclusão */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <Field label="Conclusão" htmlFor="sermon-conclusion">
            <Textarea
              id="sermon-conclusion"
              value={sermon.conclusion}
              onChange={(e) => set({ conclusion: e.target.value })}
              placeholder="Recapitule a mensagem e faça o apelo/aplicação final..."
              className="min-h-28"
            />
          </Field>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
