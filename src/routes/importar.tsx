import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateOutline } from "@/lib/generate-outline.functions";
import { emptySermon, uid, useSermons } from "@/lib/sermons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar com IA — PregaDynamic" },
      {
        name: "description",
        content:
          "Cole o texto da sua pregação do Google Docs e a IA transforma em um esboço inteligente e organizado.",
      },
    ],
  }),
  component: ImportPage,
});

const EXAMPLE = `Cole aqui o texto da sua pregação do Google Docs...

Pode ser um rascunho, anotações soltas ou uma mensagem completa. A IA vai organizar tudo em título, versículo base, tema, introdução e tópicos.`;

function ImportPage() {
  const navigate = useNavigate();
  const { saveSermon } = useSermons();
  const runGenerate = useServerFn(generateOutline);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const trimmed = text.trim();
    if (trimmed.length < 40) {
      toast.error("Cole um texto um pouco maior para a IA trabalhar.");
      return;
    }
    setLoading(true);
    try {
      const outline = await runGenerate({ data: { text: trimmed } });
      const now = Date.now();
      const base = emptySermon();
      const sermon = {
        ...base,
        title: outline.title || "Esboço sem título",
        baseVerse: outline.baseVerse,
        theme: outline.theme,
        introduction: outline.introduction,
        tags: outline.tags,
        topics:
          outline.topics.length > 0
            ? outline.topics.map((t, i) => ({
                id: uid(),
                title: t.title || `Tópico ${i + 1}`,
                content: t.content,
              }))
            : base.topics,
        createdAt: now,
        updatedAt: now,
      };
      saveSermon(sermon);
      toast.success("Esboço gerado! Revise e ajuste como quiser.");
      navigate({ to: "/editor/$id", params: { id: sermon.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar o esboço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-6">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            <Sparkles className="size-3.5" /> IA do PregaDynamic
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Esboço Inteligente
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cole o texto da sua pregação (do Google Docs ou de qualquer lugar) e a IA organiza tudo em
            um esboço pronto para o púlpito.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Texto da pregação
          </Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={EXAMPLE}
            className="min-h-72 text-base leading-relaxed"
            disabled={loading}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{text.trim().length} caracteres</span>
            <Button onClick={handleGenerate} disabled={loading} className="gap-1.5">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Gerando...
                </>
              ) : (
                <>
                  <Wand2 className="size-4" /> Gerar Esboço com IA
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
