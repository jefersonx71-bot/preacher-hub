import { createClient } from "@supabase/supabase-js";
import type { Sermon } from "./sermons";

const CONFIG_KEY = "pregadynamic.supabase.config";
const SYNC_CODE_KEY = "pregadynamic.supabase.sync_code";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Obter chaves do localStorage ou das variáveis de ambiente (VITE_*)
export function getSupabaseConfig(): SupabaseConfig | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SupabaseConfig;
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Erro ao ler config do Supabase do localStorage", e);
  }

  // Fallback para variáveis de ambiente injetadas pelo Vite
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  return null;
}

export function saveSupabaseConfig(config: SupabaseConfig | null) {
  if (typeof window === "undefined") return;
  if (config) {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } else {
    window.localStorage.removeItem(CONFIG_KEY);
  }
}

export function getSyncCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SYNC_CODE_KEY);
}

export function saveSyncCode(code: string | null) {
  if (typeof window === "undefined") return;
  if (code) {
    window.localStorage.setItem(SYNC_CODE_KEY, code.trim());
  } else {
    window.localStorage.removeItem(SYNC_CODE_KEY);
  }
}

// Retorna uma instância do cliente Supabase se as configurações existirem
export function getSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config) return null;
  try {
    return createClient(config.url, config.anonKey);
  } catch (e) {
    console.error("Erro ao criar cliente Supabase:", e);
    return null;
  }
}

// Algoritmo de Sincronização Bidirecional (Local-First)
export async function syncSermonsWithCloud(localSermons: Sermon[]): Promise<{
  syncedSermons: Sermon[];
  changesApplied: boolean;
}> {
  const syncCode = getSyncCode();
  const supabase = getSupabaseClient();

  if (!syncCode || !supabase) {
    return { syncedSermons: localSermons, changesApplied: false };
  }

  // 1. Buscar esboços da nuvem para este código de sincronização
  const { data: cloudData, error } = await supabase
    .from("sermons")
    .select("*")
    .eq("sync_key", syncCode);

  if (error) {
    throw new Error(`Falha ao buscar dados da nuvem: ${error.message}`);
  }

  const cloudSermons: Sermon[] = (cloudData || []).map((row) => ({
    id: row.id,
    title: row.title,
    baseVerse: row.base_verse || "",
    theme: row.theme || "",
    introduction: row.introduction || "",
    conclusion: row.conclusion || "",
    appeal: row.appeal || "",
    tags: row.tags || [],
    topics: typeof row.topics === "string" ? JSON.parse(row.topics) : row.topics || [],
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    deleted: row.deleted || false,
  }));

  const localMap = new Map<string, Sermon>();
  localSermons.forEach((s) => localMap.set(s.id, s));

  const cloudMap = new Map<string, Sermon>();
  cloudSermons.forEach((s) => cloudMap.set(s.id, s));

  const allIds = new Set([...localMap.keys(), ...cloudMap.keys()]);
  const mergedSermons: Sermon[] = [];
  const toUpload: Sermon[] = [];
  let changesApplied = false;

  for (const id of allIds) {
    const local = localMap.get(id);
    const cloud = cloudMap.get(id);

    if (local && !cloud) {
      // Existe apenas localmente: enviar para a nuvem
      mergedSermons.push(local);
      toUpload.push(local);
      changesApplied = true;
    } else if (!local && cloud) {
      // Existe apenas na nuvem: baixar
      mergedSermons.push(cloud);
      changesApplied = true;
    } else if (local && cloud) {
      // Existe em ambos: comparar timestamp de atualização
      if (local.updatedAt > cloud.updatedAt) {
        // Local é mais recente: enviar para a nuvem
        mergedSermons.push(local);
        toUpload.push(local);
        changesApplied = true;
      } else if (cloud.updatedAt > local.updatedAt) {
        // Nuvem é mais recente: atualizar local
        mergedSermons.push(cloud);
        changesApplied = true;
      } else {
        // Idênticos em data de modificação: manter
        mergedSermons.push(local);
      }
    }
  }

  // 2. Upload de novos/atualizados esboços para a nuvem
  if (toUpload.length > 0) {
    const rowsToUpsert = toUpload.map((s) => ({
      id: s.id,
      title: s.title,
      base_verse: s.baseVerse,
      theme: s.theme,
      introduction: s.introduction,
      conclusion: s.conclusion,
      appeal: s.appeal || "",
      tags: s.tags,
      topics: s.topics,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
      sync_key: syncCode,
      deleted: s.deleted || false,
    }));

    const { error: upsertError } = await supabase
      .from("sermons")
      .upsert(rowsToUpsert, { onConflict: "id" });

    if (upsertError) {
      throw new Error(`Falha ao enviar dados para a nuvem: ${upsertError.message}`);
    }
  }

  return {
    syncedSermons: mergedSermons,
    changesApplied,
  };
}
