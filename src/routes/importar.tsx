import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Wand2,
  Copy,
  Check,
  Save,
  RefreshCw,
  AlertCircle,
  FileText,
  Users,
  Brain,
  ChevronDown,
  ChevronUp,
  Terminal,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useSermons } from "@/lib/sermons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getApiUrl } from "@/lib/api-url";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar & Criar com IA — PregaDynamic" },
      {
        name: "description",
        content:
          "Crie esboços de pregações do zero ou reestruture seus rascunhos com o Copiloto de Homilética IA no estilo Modo Jeff.",
      },
      { property: "og:title", content: "Importar & Criar com IA — PregaDynamic" },
      {
        property: "og:description",
        content:
          "Crie esboços de pregações do zero ou reestruture seus rascunhos com o Copiloto de Homilética IA no estilo Modo Jeff.",
      },
      { property: "og:url", content: "/importar" },
    ],
    links: [{ rel: "canonical", href: "/importar" }],
  }),
  component: ImportPage,
});

interface GenerationStep {
  id: string;
  title: string;
  message: string;
  status: "pending" | "running" | "completed";
  thought?: string;
}

const EXAMPLE = `Cole aqui o texto da sua pregação do Google Docs...

Pode ser um rascunho, anotações soltas ou uma mensagem completa. A IA vai organizar tudo em título, versículo base, tema, introdução e tópicos.`;

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-4 font-sans text-[15px] leading-relaxed text-foreground/90">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("# ")) {
          return (
            <h1
              key={idx}
              className="font-display text-2xl font-bold tracking-tight text-foreground mt-6 mb-3 border-b border-border/50 pb-2"
            >
              {trimmed.replace("# ", "")}
            </h1>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={idx}
              className="font-display text-lg font-semibold tracking-tight text-foreground mt-5 mb-2"
            >
              {trimmed.replace("## ", "")}
            </h2>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={idx}
              className="font-display text-base font-semibold text-foreground mt-4 mb-2 text-gold"
            >
              {trimmed.replace("### ", "")}
            </h3>
          );
        }
        if (trimmed.startsWith("• ") || trimmed.startsWith("- ")) {
          const cleanText = trimmed.replace(/^[•-]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-4 my-1.5">
              <span className="text-gold mt-1.5 shrink-0 select-none">•</span>
              <span className="flex-1">{parseBoldText(cleanText)}</span>
            </div>
          );
        }
        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={idx} className="font-semibold text-foreground mt-3">
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (!trimmed) {
          return <div key={idx} className="h-2.5" />;
        }
        return (
          <p key={idx} className="my-2">
            {parseBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function parseBoldText(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-bold text-foreground">
          {part}
        </strong>
      );
    }
    return part;
  });
}

function ImportPage() {
  const navigate = useNavigate();
  const { saveSermon } = useSermons();

  const [activeMode, setActiveMode] = useState<"create" | "restructure">("create");

  // Create Mode state
  const [topic, setTopic] = useState("");
  const [passage, setPassage] = useState("");
  const [audience, setAudience] = useState("Congregação Geral");
  const [style, setStyle] = useState("Expositivo");

  // Restructure Mode state
  const [text, setText] = useState("");

  // Flow states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  // Structured payload
  const [structuredSermon, setStructuredSermon] = useState<any>(null);

  // SSE progress
  const [steps, setSteps] = useState<GenerationStep[]>([]);
  const [expandedThoughtId, setExpandedThoughtId] = useState<string | null>(null);

  const charCount = text.length;

  const resetFlowStates = () => {
    setResult("");
    setError("");
    setSaved(false);
    setStructuredSermon(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Esboço copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToHub = () => {
    if (!structuredSermon) {
      toast.error("Não há esboço estruturado disponível para salvar.");
      return;
    }

    const sermonId = `sermon-ai-${Date.now()}`;
    const now = Date.now();
    const sermonToSave = {
      ...structuredSermon,
      id: sermonId,
      createdAt: now,
      updatedAt: now,
    };

    saveSermon(sermonToSave);
    setSaved(true);
    toast.success("Esboço salvo com sucesso!");
    navigate({ to: "/editor/$id", params: { id: sermonId } });
  };

  const handleGenerateFromScratch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      toast.error("Por favor, insira o tema principal.");
      return;
    }
    if (!passage.trim()) {
      toast.error("Por favor, insira a passagem bíblica.");
      return;
    }

    setLoading(true);
    resetFlowStates();

    const initialSteps: GenerationStep[] = [
      {
        id: "investigating",
        title: "Investigando Contexto e Escrituras",
        message: "Conectando ao banco de dados exegético da Palavra...",
        status: "pending",
      },
      {
        id: "thinking",
        title: "Raciocínio Homilético (CoT)",
        message: "Aguardando investigação concluir...",
        status: "pending",
      },
      {
        id: "drafting",
        title: "Redigindo Mensagem no Modo Jeff",
        message: "Aguardando estruturação...",
        status: "pending",
      },
    ];
    setSteps(initialSteps);
    setExpandedThoughtId(null);

    try {
      const response = await fetch(getApiUrl("/api/generate-outline-stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          passage: passage.trim(),
          audience,
          style,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro de conexão ao iniciar o fluxo de homilética.");
      }

      await readStream(response);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com a IA do servidor.");
      toast.error(err.message || "Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 40) {
      toast.error("Cole um texto um pouco maior para a IA trabalhar.");
      return;
    }

    setLoading(true);
    resetFlowStates();

    const initialSteps: GenerationStep[] = [
      {
        id: "investigating",
        title: "Analisando Notas Fornecidas",
        message: "Analisando referências e extraindo as passagens citadas...",
        status: "pending",
      },
      {
        id: "thinking",
        title: "Modelagem Homilética (CoT)",
        message: "Aguardando análise de notas iniciar...",
        status: "pending",
      },
      {
        id: "drafting",
        title: "Estruturando Rascunho no Modo Jeff",
        message: "Aguardando estruturação...",
        status: "pending",
      },
    ];
    setSteps(initialSteps);
    setExpandedThoughtId(null);

    try {
      const response = await fetch(getApiUrl("/api/analyze-sermon-stream"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erro de conexão ao iniciar a estruturação do rascunho.");
      }

      await readStream(response);
    } catch (err: any) {
      setError(err.message || "Erro ao enviar rascunho para a IA do servidor.");
      toast.error(err.message || "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const readStream = async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Resposta de streaming indisponível no navegador.");
    }

    const decoder = new TextDecoder();
    let streamBuffer = "";

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
                  return { ...s, status: "running", message: "Escrevendo o esboço..." };
                }
                return s;
              }),
            );
            setResult((prev) => prev + event.text);
          } else if (event.type === "sermon") {
            setStructuredSermon(event.sermon);
          } else if (event.type === "done") {
            setSteps((prev) => prev.map((s) => ({ ...s, status: "completed" })));
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        } catch (e: any) {
          console.warn("Parse line error:", e);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {/* Header bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
          <div className="text-[10px] font-bold tracking-wider font-mono uppercase text-gold bg-gold/10 px-2 py-0.5 rounded border border-gold/15">
            Copiloto Ativo
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 mt-6 space-y-6">
        {/* Title and Intro */}
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Sparkles className="size-3.5" /> IA do PregaDynamic
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Assistente de Homilética
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Sua central de apoio ministerial. Escolha entre gerar um sermão completo do zero
            contendo ilustrações ideais ou reestruturar as notas que você já rascunhou.
          </p>
        </div>

        {/* MODE SELECTOR TABS */}
        <div className="flex bg-secondary p-1 rounded-xl border border-border max-w-md">
          <button
            onClick={() => {
              setActiveMode("create");
              resetFlowStates();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === "create"
                ? "bg-card text-foreground shadow-sm border border-border/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles size={13} className={activeMode === "create" ? "text-gold" : ""} />
            Criar do Zero com IA
          </button>
          <button
            onClick={() => {
              setActiveMode("restructure");
              resetFlowStates();
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeMode === "restructure"
                ? "bg-card text-foreground shadow-sm border border-border/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText size={13} className={activeMode === "restructure" ? "text-gold" : ""} />
            Estruturar Rascunho / Docs
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Forms */}
          <div className="lg:col-span-5 bg-card border border-border rounded-2xl p-5 shadow-soft space-y-4">
            {activeMode === "create" ? (
              /* CREATE MODE FORM (Copiloto) */
              <form onSubmit={handleGenerateFromScratch} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="ai-topic"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Tema ou Tópico Principal *
                  </Label>
                  <Input
                    id="ai-topic"
                    type="text"
                    placeholder="Ex: Confiança na Tempestade, Fé Prática"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={loading}
                    className="h-11 text-sm shadow-soft"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="ai-passage"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Passagem Bíblica Chave *
                  </Label>
                  <Input
                    id="ai-passage"
                    type="text"
                    placeholder="Ex: Mateus 14:22-33, Salmo 46"
                    value={passage}
                    onChange={(e) => setPassage(e.target.value)}
                    disabled={loading}
                    className="h-11 text-sm shadow-soft"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="ai-audience"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                  >
                    <Users size={12} className="text-muted-foreground" /> Público Alvo
                  </Label>
                  <select
                    id="ai-audience"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors cursor-pointer shadow-soft"
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

                <div className="space-y-1.5">
                  <Label
                    htmlFor="ai-style"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
                  >
                    <Brain size={12} className="text-muted-foreground" /> Estilo Homilético
                  </Label>
                  <select
                    id="ai-style"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-gold focus:border-gold transition-colors cursor-pointer shadow-soft"
                  >
                    <option value="Expositivo">Expositivo (Análise detalhada do texto)</option>
                    <option value="Temático">Temático (Focado num assunto ou doutrina)</option>
                    <option value="Textual">Textual (Baseado em versículo curto)</option>
                    <option value="Devocional">Devocional (Prático, íntimo e acolhedor)</option>
                  </select>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs text-left">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  id="btn-generate-ai-sermon"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-5 bg-gold hover:bg-gold/90 text-gold-foreground font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-gold"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Meditando na Palavra...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="animate-pulse" />
                      Criar Esboço Inspirador
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* RESTRUCTURE MODE FORM (Esboço Inteligente) */
              <form onSubmit={handleAnalyzeText} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="pasted-sermon"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Anotações / Notas Brutas
                  </Label>
                  <Textarea
                    id="pasted-sermon"
                    rows={12}
                    placeholder={EXAMPLE}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={loading}
                    className="w-full p-4 bg-background border border-input focus:border-gold rounded-xl text-foreground placeholder-muted-foreground/60 focus:outline-none transition-colors text-sm leading-relaxed resize-none shadow-soft min-h-[300px]"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs text-left">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Character count & Submit Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span id="char-counter" className="text-xs font-mono text-muted-foreground">
                    {charCount} caracteres
                  </span>

                  <Button
                    id="btn-submit-smart-analysis"
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-3 bg-gold hover:bg-gold/90 text-gold-foreground font-semibold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-gold"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Estruturando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Estruturar Esboço
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Right Side: Output Result Box */}
          <div className="lg:col-span-7 space-y-6">
            {/* AGENT STEPS PROGRESS BAR */}
            {(loading || result) && steps.length > 0 && (
              <div
                id="antigravity-timeline"
                className="bg-zinc-950 text-zinc-100 rounded-2xl p-5 border border-zinc-800 shadow-xl space-y-4 text-left animate-in fade-in duration-300"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-gold" />
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                      Rastro Homilético do Agente
                    </span>
                  </div>
                  {loading ? (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/10 text-gold border border-gold/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                      Processando...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Concluído
                    </span>
                  )}
                </div>

                <div className="space-y-3.5 font-sans">
                  {steps.map((step) => {
                    const isCompleted = step.status === "completed";
                    const isRunning = step.status === "running";

                    return (
                      <div key={step.id} className="space-y-1.5">
                        <div className="flex items-start gap-3">
                          {/* Step Badge Indicator */}
                          <div className="mt-0.5 shrink-0">
                            {isCompleted ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold shadow-sm">
                                ✓
                              </div>
                            ) : isRunning ? (
                              <div className="w-5 h-5 rounded-full bg-gold/20 text-gold border border-gold/30 flex items-center justify-center text-[10px] font-bold animate-spin">
                                <RefreshCw size={10} />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-zinc-900 text-zinc-550 border border-zinc-800 flex items-center justify-center text-[10px] font-bold">
                                •
                              </div>
                            )}
                          </div>

                          {/* Step info */}
                          <div className="space-y-0.5 text-left">
                            <h5
                              className={`text-xs font-bold leading-normal ${
                                isCompleted
                                  ? "text-zinc-400"
                                  : isRunning
                                    ? "text-white"
                                    : "text-zinc-650"
                              }`}
                            >
                              {step.title}
                            </h5>
                            <p className="text-[11px] text-zinc-450 leading-relaxed font-medium">
                              {step.message}
                            </p>
                          </div>
                        </div>

                        {/* Expandable CoT */}
                        {step.thought && (isRunning || isCompleted) && (
                          <div className="ml-8 border-l border-zinc-800 pl-4 py-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedThoughtId(expandedThoughtId === step.id ? null : step.id)
                              }
                              className="flex items-center gap-1.5 text-[10.5px] font-semibold text-gold hover:text-gold/80 transition-colors select-none cursor-pointer"
                            >
                              <Brain size={11} className="animate-pulse" />
                              {expandedThoughtId === step.id
                                ? "Ocultar Processo Cognitivo"
                                : "Visualizar Processo Cognitivo (CoT)"}
                              {expandedThoughtId === step.id ? (
                                <ChevronUp size={11} />
                              ) : (
                                <ChevronDown size={11} />
                              )}
                            </button>

                            {expandedThoughtId === step.id && (
                              <div className="mt-2 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed text-left whitespace-pre-wrap max-h-48 overflow-y-auto">
                                <span className="text-gold font-bold block mb-1.5">
                                  === AGENT THINKING TRACE ===
                                </span>
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

            {/* MAIN CONTENT CONTAINER */}
            {loading && !result ? (
              /* Loading screen */
              <div
                id="ai-loading-stage"
                className="bg-card border border-border rounded-2xl p-12 text-center space-y-6 shadow-soft min-h-[300px] flex flex-col items-center justify-center animate-pulse"
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-4 border-gold/15 border-t-gold animate-spin"></div>
                  <Sparkles className="absolute text-gold animate-pulse" size={18} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-display font-semibold text-foreground text-base">
                    Invocando Inteligência Teológica
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Sincronizando as diretrizes da homilética com as escrituras sagradas...
                  </p>
                </div>
              </div>
            ) : result ? (
              /* Sermon Output Card */
              <div
                id="ai-result-panel"
                className="bg-card border border-border rounded-2xl shadow-soft flex flex-col overflow-hidden max-h-[82vh] animate-in fade-in duration-300"
              >
                {/* Header Toolbar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/35">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={12} className="text-gold animate-pulse" />
                    {loading ? "Transmitindo Esboço..." : "Esboço Pronto"}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      id="btn-copy-ai-result"
                      onClick={handleCopy}
                      disabled={loading}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-9 cursor-pointer rounded-xl"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-500 font-bold" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copiar
                        </>
                      )}
                    </Button>
                    <Button
                      id="btn-save-ai-result"
                      onClick={handleSaveToHub}
                      disabled={saved || loading || !structuredSermon}
                      size="sm"
                      className={`gap-1.5 text-xs h-9 cursor-pointer rounded-xl ${
                        saved
                          ? "bg-emerald-500 hover:bg-emerald-500/90 text-white"
                          : "bg-gold hover:bg-gold/90 text-gold-foreground"
                      }`}
                    >
                      <Save size={12} />
                      {saved ? "Salvo no Hub!" : "Salvar no Hub"}
                    </Button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-5 bg-secondary/15">
                  <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-5 md:p-6 shadow-soft text-left relative">
                    <SimpleMarkdown text={result} />

                    {loading && (
                      <span
                        className="inline-block w-2 bg-gold animate-pulse h-4 ml-1 align-middle"
                        title="Gerando..."
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Idle state */
              <div
                id="ai-blank-state"
                className="bg-card border border-dashed border-border rounded-2xl p-16 text-center text-muted-foreground min-h-[450px] flex flex-col items-center justify-center space-y-4 shadow-soft"
              >
                <div className="p-4 rounded-full bg-gold/5 border border-gold/10 text-gold">
                  <Sparkles size={32} />
                </div>
                <div className="max-w-xs space-y-1.5">
                  <h3 className="font-display font-semibold text-foreground text-base">
                    Pronto para inspirar?
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activeMode === "create"
                      ? "Preencha o tema e a passagem bíblica à esquerda para gerar uma estrutura rica com introdução cativante, tópicos bem delineados e aplicações homiléticas."
                      : "Insira suas notas ou rascunhos soltos para que a nossa inteligência homilética as organize de forma polida mantendo sua essência espiritual."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
