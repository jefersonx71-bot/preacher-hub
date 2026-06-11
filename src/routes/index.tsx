import { useMemo, useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  BookOpen, Plus, Search, Sparkles, Wand2, 
  Cloud, CloudOff, Key, Copy, Check, 
  Database, AlertCircle, Loader2 
} from "lucide-react";
import { useSermons } from "@/lib/sermons";
import { SermonCard } from "@/components/SermonCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  getSyncCode, saveSyncCode, 
  getSupabaseConfig, saveSupabaseConfig 
} from "@/lib/supabase";
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

function Dashboard() {
  const { 
    sermons, 
    deleteSermon, 
    syncStatus, 
    lastSyncedAt, 
    triggerSync 
  } = useSermons();

  const [query, setQuery] = useState("");
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [currentSyncCode, setCurrentSyncCode] = useState<string | null>(null);
  const [tempSyncCode, setTempSyncCode] = useState("");
  const [dbUrl, setDbUrl] = useState("");
  const [dbKey, setDbKey] = useState("");
  const [showAdvancedDb, setShowAdvancedDb] = useState(false);
  const [copied, setCopied] = useState(false);

  // Carregar dados salvos ao montar componente
  useEffect(() => {
    const code = getSyncCode();
    setCurrentSyncCode(code);
    if (code) {
      setTempSyncCode(code);
    }

    const config = getSupabaseConfig();
    if (config) {
      setDbUrl(config.url);
      setDbKey(config.anonKey);
    }
  }, []);

  const handleGenerateCode = () => {
    const rand = () => Math.random().toString(36).substring(2, 7);
    const code = `prega-${rand()}-${rand()}`;
    setTempSyncCode(code);
  };

  const handleApplySyncCode = async () => {
    const code = tempSyncCode.trim();
    if (!code) {
      toast.error("O código de sincronização não pode ser vazio.");
      return;
    }

    const config = getSupabaseConfig();
    if (!config) {
      toast.warning("Configure o banco de dados Supabase nas opções avançadas para ativar.");
      setShowAdvancedDb(true);
      return;
    }

    saveSyncCode(code);
    setCurrentSyncCode(code);
    toast.success("Código de sincronização configurado!");
    await triggerSync();
  };

  const handleDisableSync = () => {
    saveSyncCode(null);
    setCurrentSyncCode(null);
    setTempSyncCode("");
    toast.success("Sincronização online desativada.");
  };

  const handleCopyCode = () => {
    if (!currentSyncCode) return;
    navigator.clipboard.writeText(currentSyncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Código copiado!");
  };

  const handleSaveCustomDb = () => {
    const url = dbUrl.trim();
    const key = dbKey.trim();

    if (!url || !key) {
      toast.error("Preencha a URL e a Anon Key do Supabase.");
      return;
    }

    saveSupabaseConfig({ url, anonKey: key });
    toast.success("Credenciais do Supabase salvas!");
    
    const code = getSyncCode();
    if (code) {
      triggerSync();
    }
  };

  const handleResetDbConfig = () => {
    saveSupabaseConfig(null);
    setDbUrl("");
    setDbKey("");
    toast.success("Credenciais redefinidas para o padrão (.env)");
  };

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
          <div className="flex items-center gap-2">
            {/* Indicador de Sync */}
            <button
              onClick={() => setShowSyncSettings((prev) => !prev)}
              aria-label="Configurações de Sincronização"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary cursor-pointer",
                syncStatus === "success" && "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10",
                syncStatus === "syncing" && "text-gold border-gold/20 bg-gold/5",
                syncStatus === "error" && "text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10",
                syncStatus === "offline" && "text-muted-foreground border-border bg-secondary/20",
                syncStatus === "not_configured" && "text-muted-foreground hover:text-foreground hover:bg-secondary"
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

        {/* Painel de Sincronização Online */}
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
                <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Status do Sync</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  {syncStatus === "syncing" && "Sincronizando com a nuvem..."}
                  {syncStatus === "success" && "Esboços sincronizados e seguros!"}
                  {syncStatus === "error" && "Erro ao conectar com o banco de dados."}
                  {syncStatus === "offline" && "Dispositivo sem internet. Sync em pausa."}
                  {syncStatus === "not_configured" && "Sincronização desativada (Modo Local)"}
                </span>
              </div>
              {lastSyncedAt && (
                <div className="text-right">
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Último Sync</span>
                  <span className="font-medium text-foreground">
                    {new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              )}
            </div>

            {/* Configurar Código */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">
                Código de Sincronização (Sync Code)
              </label>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Insira um código exclusivo (ex: seu e-mail ou frase secreta) para sincronizar seus esboços com o celular ou tablet.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Key className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    type="text"
                    value={tempSyncCode}
                    onChange={(e) => setTempSyncCode(e.target.value)}
                    placeholder="Ex: pastor-marcos-sync"
                    className="pl-9 bg-background/50 h-10 border-border text-sm"
                  />
                </div>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={handleGenerateCode}
                  className="h-10 text-xs px-3"
                >
                  Gerar Código
                </Button>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleApplySyncCode}
                  disabled={syncStatus === "syncing"}
                  className="flex-1 h-9 text-xs"
                >
                  {currentSyncCode ? "Atualizar Código" : "Ativar Sincronização"}
                </Button>
                {currentSyncCode && (
                  <Button
                    onClick={handleDisableSync}
                    variant="outline"
                    className="h-9 text-xs border-destructive/20 text-destructive hover:bg-destructive/10"
                  >
                    Desativar
                  </Button>
                )}
              </div>

              {currentSyncCode && (
                <div className="flex items-center justify-between text-xs border border-border bg-background/30 rounded-lg p-2.5 mt-2">
                  <span className="text-muted-foreground font-medium">Código Ativo no Dispositivo:</span>
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono text-gold font-bold bg-gold/5 px-2 py-0.5 rounded border border-gold/15">
                      {currentSyncCode}
                    </code>
                    <button
                      onClick={handleCopyCode}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      title="Copiar código"
                    >
                      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Configurações de Banco customizadas */}
            <div className="border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setShowAdvancedDb((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
              >
                <Database className="size-3.5" />
                {showAdvancedDb ? "Ocultar Configurações de Banco" : "Configurar Banco de Dados Próprio (Self-Hosting)"}
              </button>

              {showAdvancedDb && (
                <div className="mt-3 space-y-3 p-3 bg-secondary/5 border border-border rounded-lg animate-in fade-in slide-in-from-top-1 duration-150">
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Você pode criar um banco gratuito no <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-gold underline font-medium">Supabase</a>, rodar o script SQL de criação de tabela (disponível no arquivo <code className="font-mono bg-secondary/50 px-1 rounded">supabase.sql</code> no repositório) e preencher os dados abaixo para usar seu banco próprio.
                  </p>
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Supabase Project URL
                      </label>
                      <Input
                        type="text"
                        value={dbUrl}
                        onChange={(e) => setDbUrl(e.target.value)}
                        placeholder="https://xxxxxx.supabase.co"
                        className="h-8 text-xs bg-background/50"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Supabase Public Anon Key
                      </label>
                      <Input
                        type="password"
                        value={dbKey}
                        onChange={(e) => setDbKey(e.target.value)}
                        placeholder="Chave anônima pública (anon key)"
                        className="h-8 text-xs bg-background/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleSaveCustomDb}
                        className="h-8 text-xs flex-1"
                        variant="secondary"
                      >
                        Salvar Credenciais
                      </Button>
                      {(dbUrl || dbKey) && (
                        <Button
                          type="button"
                          onClick={handleResetDbConfig}
                          className="h-8 text-xs border-dashed"
                          variant="outline"
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
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



        {/* List Header with Search */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Esboços salvos
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
