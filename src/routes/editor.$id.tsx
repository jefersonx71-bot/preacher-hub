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
import {
  ArrowLeft,
  Check,
  Plus,
  Presentation,
  Sparkles,
  RefreshCw,
  Terminal,
  Brain,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  ALL_TAGS,
  emptySermon,
  getSermon,
  uid,
  useSermons,
  type Sermon,
  type Topic,
} from "@/lib/sermons";
import { getApiUrl } from "@/lib/api-url";
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

  const [audience, setAudience] = useState("Congregação Geral");
  const [style, setStyle] = useState("Expositivo");
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const [expandedThoughtId, setExpandedThoughtId] = useState<string | null>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const handleAdaptSermon = async () => {
    if (!sermon) return;
    setLoading(true);
    setExpandedThoughtId(null);
    const initialSteps = [
      {
        id: "investigating",
        title: "Analisando Esboço Atual",
        message: `Avaliando as passagens e estrutura de "${sermon.title}"...`,
        status: "pending",
      },
      {
        id: "thinking",
        title: "Raciocínio de Adaptação (CoT)",
        message: "Aguardando análise terminar...",
        status: "pending",
      },
      {
        id: "drafting",
        title: "Reescrevendo sob Nova Perspectiva",
        message: "Aguardando estruturação...",
        status: "pending",
      },
    ];
    setSteps(initialSteps);

    try {
      const response = await fetch(getApiUrl("/api/adapt-sermon-stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sermon, audience, style }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro de conexão ao iniciar adaptação.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Resposta de streaming indisponível.");

      const decoder = new TextDecoder();
      let streamBuffer = "";
      let accumulatedResult = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split("\n");
        streamBuffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const rawJson = trimmed.slice(6);
            const event = JSON.parse(rawJson);

            if (event.type === "step") {
              setSteps((prev) =>
                prev.map((s) => {
                  if (s.id === event.id) {
                    return {
                      ...s,
                      status: event.status,
                      message: event.message,
                      thought: event.thought,
                    };
                  }
                  if (
                    (event.id === "thinking" && s.id === "investigating") ||
                    (event.id === "drafting" && (s.id === "investigating" || s.id === "thinking"))
                  ) {
                    return { ...s, status: "completed" };
                  }
                  return s;
                }),
              );
              if (event.thought) {
                setExpandedThoughtId(event.id);
              }
            } else if (event.type === "chunk") {
              setSteps((prev) =>
                prev.map((s) => {
                  if (s.id === "investigating" || s.id === "thinking") {
                    return { ...s, status: "completed" };
                  }
                  if (s.id === "drafting") {
                    return { ...s, status: "running", message: "Escrevendo o esboço adaptado..." };
                  }
                  return s;
                }),
              );
              accumulatedResult += event.text;
            } else if (event.type === "sermon") {
              const parsed = event.sermon;
              set({
                title: parsed.title,
                theme: parsed.theme,
                introduction: parsed.introduction,
                topics: parsed.topics,
                conclusion: parsed.conclusion,
                appeal: parsed.appeal,
                tags: parsed.tags,
              });
            } else if (event.type === "done") {
              setSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
              toast.success("Esboço adaptado com sucesso! Salve para registrar as alterações.");
              setShowAiPanel(false);
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (e: any) {
            console.warn("Parse stream line error:", e);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro durante a adaptação com IA.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* IA Adaptation Panel */}
        {id !== "new" && (
          <div className="rounded-2xl border border-gold/20 bg-gold/5 p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4.5 text-gold animate-pulse" />
                <h3 className="font-display text-sm font-semibold text-foreground">
                  Adaptar Estilo &amp; Público com IA
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAiPanel((prev) => !prev)}
                className="text-xs font-semibold text-gold hover:underline cursor-pointer"
              >
                {showAiPanel ? "Ocultar Painel" : "Mostrar Opções"}
              </button>
            </div>

            {showAiPanel && (
              <div className="space-y-4 pt-2 border-t border-gold/10 animate-in fade-in duration-205">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reescreva as ilustrações, linguagem e aplicações deste esboço sob medida para um
                  público-alvo ou estilo homilético diferente. As alterações serão aplicadas
                  diretamente nos campos abaixo após a geração.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      Novo Público Alvo
                    </label>
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors cursor-pointer"
                    >
                      <option value="Congregação Geral">Membros Gerais / Congregação</option>
                      <option value="Jovens e Adolescentes">Jovens e Adolescentes</option>
                      <option value="Casais e Famílias">Casais e Famílias</option>
                      <option value="Líderes e Obreiros">Líderes e Obreiros</option>
                      <option value="Não Cristãos / Evangelístico">
                        Não Cristãos / Evangelístico
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      Novo Estilo Homilético
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors cursor-pointer"
                    >
                      <option value="Expositivo">Expositivo (Análise do texto)</option>
                      <option value="Temático">Temático (Focado num assunto)</option>
                      <option value="Textual">Textual (Baseado em versículo curto)</option>
                      <option value="Devocional">Devocional (Prático e acolhedor)</option>
                    </select>
                  </div>
                </div>

                {/* Steps and output timeline */}
                {loading && steps.length > 0 && (
                  <div className="bg-zinc-950 text-zinc-100 rounded-xl p-4 border border-zinc-800 space-y-3 text-left">
                    <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
                      <Terminal size={12} className="text-gold" />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                        Processo do Copiloto IA
                      </span>
                      <Loader2 className="size-3 animate-spin text-gold ml-auto" />
                    </div>

                    <div className="space-y-2.5 font-sans">
                      {steps.map((step) => {
                        const isCompleted = step.status === "completed";
                        const isRunning = step.status === "running";

                        return (
                          <div key={step.id} className="space-y-1">
                            <div className="flex items-start gap-2 text-xs">
                              <span className="mt-0.5 shrink-0 text-[10px]">
                                {isCompleted ? "✓" : isRunning ? "⏳" : "•"}
                              </span>
                              <div className="space-y-0.5 text-left">
                                <h5
                                  className={cn(
                                    "font-bold text-[11px]",
                                    isCompleted ? "text-zinc-550" : "text-zinc-300",
                                  )}
                                >
                                  {step.title}
                                </h5>
                                <p className="text-[10px] text-zinc-400">{step.message}</p>
                              </div>
                            </div>

                            {step.thought && (isRunning || isCompleted) && (
                              <div className="ml-4 border-l border-zinc-850 pl-3 py-1 text-left">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedThoughtId(
                                      expandedThoughtId === step.id ? null : step.id,
                                    )
                                  }
                                  className="flex items-center gap-1 text-[9px] text-gold hover:underline cursor-pointer select-none"
                                >
                                  <Brain size={10} className="animate-pulse" />
                                  {expandedThoughtId === step.id
                                    ? "Ocultar Pensamento"
                                    : "Ver Pensamento Teológico"}
                                </button>

                                {expandedThoughtId === step.id && (
                                  <div className="mt-1.5 bg-zinc-900 p-2.5 rounded border border-zinc-850 font-mono text-[9px] text-zinc-350 leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                                    {step.thought}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleAdaptSermon}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-gold-foreground font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-gold"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={12} className="animate-spin" />
                      Adaptando Esboço...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} />
                      Reescrever Esboço para {audience} ({style})
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

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
              <h2 className="font-display text-xl font-semibold text-foreground">
                Desenvolvimento
              </h2>
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

        {/* Conclusão & Apelo */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <Field label="Conclusão" htmlFor="sermon-conclusion">
            <Textarea
              id="sermon-conclusion"
              value={sermon.conclusion}
              onChange={(e) => set({ conclusion: e.target.value })}
              placeholder="Recapitule a mensagem..."
              className="min-h-28"
            />
          </Field>
          <Field label="Apelo (Chamada de Resposta Prática)" htmlFor="sermon-appeal">
            <Textarea
              id="sermon-appeal"
              value={sermon.appeal || ""}
              onChange={(e) => set({ appeal: e.target.value })}
              placeholder="Escreva o apelo final para a congregação (Modo Jeff)..."
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
