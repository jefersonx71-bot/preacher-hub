import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Plus,
  Search,
  Sparkles,
  Wand2,
  Cloud,
  CloudOff,
  AlertCircle,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { useSermons } from "@/lib/sermons";
import { useAuth } from "@/lib/auth";
import { SermonCard } from "@/components/SermonCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

import { KeyRound, SmartphoneNfc } from "lucide-react";

function Dashboard() {
  const { sermons, deleteSermon, syncStatus, lastSyncedAt, triggerSync } = useSermons();
  const { user, loading: authLoading, generateSyncCode, connectSyncCode, signOut, isAuthenticated } = useAuth();

  const [query, setQuery] = useState("");
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncCodeInput, setSyncCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    setGenerating(true);
    setGeneratedCode(null);
    try {
      const code = await generateSyncCode();
      setGeneratedCode(code);
      toast.success("Código gerado! Use-o no outro aparelho.");
    } catch (err) {
      console.error("Erro ao gerar código:", err);
      toast.error("Erro ao gerar código. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleConnectCode = async () => {
    const cleanCode = syncCodeInput.replace(/[^a-zA-Z0-9]/g, "");
    if (cleanCode.length !== 6) {
      toast.error("O código precisa ter 6 caracteres.");
      return;
    }
    setConnecting(true);
    try {
      await connectSyncCode(cleanCode);
      toast.success("Aparelhos conectados com sucesso!");
    } catch (err) {
      console.error("Erro ao conectar código:", err);
      toast.error("Código inválido ou erro de conexão.");
    } finally {
      setConnecting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Desconectado com sucesso.");
    } catch (err) {
      console.error("Erro ao sair:", err);
      toast.error("Erro ao desconectar.");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons
      .filter((s) =>
        q ? s.title.toLowerCase().includes(q) || s.baseVerse.toLowerCase().includes(q) : true,
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
          <div className="flex items-center gap-2">
            {/* Indicador de Sync */}
            <button
              onClick={() => setShowSyncSettings((prev) => !prev)}
              aria-label="Configurações de Sincronização"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary cursor-pointer",
                syncStatus === "success" &&
                  "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
                syncStatus === "syncing" && "text-gold border-gold/20 bg-gold/5",
                syncStatus === "error" &&
                  "text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10",
                syncStatus === "offline" && "text-muted-foreground border-border bg-secondary/20",
                syncStatus === "not_configured" &&
                  "text-muted-foreground hover:text-foreground hover:bg-secondary",
              )}
            >
              {syncStatus === "syncing" && <Loader2 className="size-3.5 animate-spin text-gold" />}
              {syncStatus === "success" && <Cloud className="size-3.5" />}
              {syncStatus === "error" && <AlertCircle className="size-3.5" />}
              {syncStatus === "offline" && <CloudOff className="size-3.5" />}
              {syncStatus === "not_configured" && <Cloud className="size-3.5" />}

              <span className="hidden sm:inline">
                {syncStatus === "syncing" && "Sincronizando..."}
                {syncStatus === "success" && "Sincronizado"}
                {syncStatus === "error" && "Erro no Sync"}
                {syncStatus === "offline" && "Offline"}
                {syncStatus === "not_configured" && "Ativar Sync"}
              </span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        {/* Painel de Sincronização */}
        {showSyncSettings && (
          <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-soft space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                <Cloud className="size-4.5 text-gold" /> Sincronização Online
              </h3>
              <button
                onClick={() => setShowSyncSettings(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Fechar
              </button>
            </div>

            {/* Status da Sincronização */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/15 p-3 rounded-lg border border-border/50 text-xs">
              <div className="space-y-0.5">
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Status do Sync
                </span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  {syncStatus === "syncing" && "Sincronizando com a nuvem..."}
                  {syncStatus === "success" && "Esboços sincronizados e seguros!"}
                  {syncStatus === "error" && "Erro ao conectar com o banco de dados."}
                  {syncStatus === "offline" && "Dispositivo sem internet. Sync em pausa."}
                  {syncStatus === "not_configured" && "Faça login para ativar a sincronização"}
                </span>
              </div>
              {lastSyncedAt && (
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Último Sync
                  </span>
                  <span className="font-medium text-foreground">
                    {new Date(lastSyncedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* ── PIN Sync System ── */}
            {!authLoading && !isAuthenticated && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                    Vincular Aparelhos
                  </label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sincronize seus esboços entre o PC e o celular usando um código rápido. Não precisa de e-mail nem senha!
                  </p>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-border p-3 bg-secondary/5">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <SmartphoneNfc className="size-3.5 text-gold" /> Aparelho Principal
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Gere um código neste aparelho para conectar os outros.
                    </p>
                    {generatedCode ? (
                      <div className="mt-2 text-center py-2 bg-gold/10 border border-gold/20 rounded-md">
                        <span className="block text-[10px] uppercase font-bold text-gold/70 mb-0.5">Seu Código</span>
                        <span className="font-display text-xl tracking-widest text-gold font-bold">{generatedCode}</span>
                      </div>
                    ) : (
                      <Button
                        onClick={handleGenerateCode}
                        disabled={generating}
                        className="w-full h-9 mt-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm text-xs"
                      >
                        {generating ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : null}
                        {generating ? "Gerando..." : "Gerar Código"}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-border p-3 bg-secondary/5">
                    <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-blue-500" /> Outro Aparelho
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Digite aqui o código gerado no seu aparelho principal.
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={syncCodeInput}
                        onChange={(e) => setSyncCodeInput(e.target.value)}
                        placeholder="EX: ABC-123"
                        className="h-9 text-xs uppercase text-center font-mono tracking-widest placeholder:tracking-normal"
                        maxLength={7}
                      />
                      <Button
                        onClick={handleConnectCode}
                        disabled={connecting || syncCodeInput.length < 6}
                        className="h-9 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {connecting ? <Loader2 className="size-3.5 animate-spin" /> : "Conectar"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Loading auth ── */}
            {authLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Verificando autenticação...
              </div>
            )}

            {/* ── Perfil do usuário logado ── */}
            {!authLoading && isAuthenticated && user && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Avatar"
                      className="size-10 rounded-full border-2 border-emerald-500/20"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/20">
                      <User className="size-5 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user.displayName || "Aparelho Conectado"}
                    </p>
                    {user.email?.includes("@sync.preacher-hub.app") ? (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        Código: <strong className="text-foreground font-mono tracking-widest">{user.email.split("@")[0].toUpperCase().slice(0,3)}-{user.email.split("@")[0].toUpperCase().slice(3)}</strong>
                      </p>
                    ) : user.displayName ? (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    ) : null}
                    <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider mt-1">
                      Sync automático via PIN ativo
                    </p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="size-3.5 mr-1" />
                    Sair
                  </Button>
                </div>

                <button
                  onClick={() => triggerSync()}
                  disabled={syncStatus === "syncing"}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/40 cursor-pointer disabled:opacity-50"
                >
                  {syncStatus === "syncing" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Cloud className="size-3.5" />
                  )}
                  {syncStatus === "syncing" ? "Sincronizando..." : "Forçar Sincronização"}
                </button>
              </div>
            )}

            {/* Dica sobre Modo Offline */}
            <div className="flex gap-2.5 items-start bg-secondary/5 border border-border/60 p-3 rounded-lg text-xs text-muted-foreground mt-3">
              <AlertCircle className="size-4.5 text-gold shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-foreground">Dica de Púlpito:</strong> Seus esboços são
                salvos no navegador automaticamente e funcionam{" "}
                <strong className="text-gold">100% offline</strong> sem internet. A sincronização em
                nuvem serve para compartilhar os esboços com seus outros aparelhos.
              </p>
            </div>
          </div>
        )}

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
          className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/35 relative overflow-hidden group"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <BookOpen className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              Bíblia para estudo
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500 border border-emerald-500/20">
                Suporta Offline
              </span>
            </span>
            <span className="block text-sm text-muted-foreground">
              Leia e compare versões versículo a versículo (baixe para o púlpito)
            </span>
          </span>
        </Link>

        {/* List Header with Search */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            Esboços salvos
            <span className="inline-flex items-center justify-center rounded-full bg-secondary/80 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
              {sermons.length}
            </span>
          </h2>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título ou versículo..."
              aria-label="Buscar esboços por título ou versículo"
              className="h-10 rounded-xl border-border bg-card pl-9 pr-4 text-sm shadow-soft transition-all focus-visible:ring-1 focus-visible:ring-gold"
            />
          </div>
        </div>
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
