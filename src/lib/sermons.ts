import { useCallback, useEffect, useState } from "react";
import { getSyncCode, getSupabaseConfig, syncSermonsWithCloud } from "./supabase";

export interface Topic {
  id: string;
  title: string;
  content: string;
}

export interface Sermon {
  id: string;
  title: string;
  baseVerse: string;
  theme: string;
  introduction: string;
  conclusion: string;
  appeal?: string;
  tags: string[];
  topics: Topic[];
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

const STORAGE_KEY = "pregadynamic.sermons.v1";

export const ALL_TAGS = [
  "Fé",
  "Família",
  "Salvação",
  "Antigo Testamento",
  "Novo Testamento",
  "Esperança",
  "Oração",
  "Graça",
];

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function emptySermon(): Sermon {
  const now = Date.now();
  return {
    id: uid(),
    title: "",
    baseVerse: "",
    theme: "",
    introduction: "",
    conclusion: "",
    appeal: "",
    tags: [],
    topics: [{ id: uid(), title: "1. Primeiro ponto", content: "" }],
    createdAt: now,
    updatedAt: now,
  };
}

const SEED: Sermon[] = [
  {
    id: "seed-vento",
    title: "Quando o Vento Contrário Abre o Caminho",
    baseVerse: "Êxodo 14:21",
    theme: "O vento que parece um problema é a ferramenta do milagre.",
    introduction:
      "Muitas vezes clamamos a Deus por um caminho livre, mas Ele permite o vento contrário. Hoje aprenderemos que o vento forte não vem para nos destruir, mas para abrir o caminho que nos levará ao outro lado.",
    conclusion:
      "O mar se abre não apesar do vento, mas por causa dele. Confie no Senhor no meio da noite escura e sob o vento forte, pois o seu milagre está sendo preparado no meio do sopro da tempestade.",
    appeal:
      "Se você quer caminhar sob o vento de Deus e ver a abertura do mar em sua vida, dê um passo à frente hoje. Não tema a noite escura. Coloque a sua fé em ação!",
    tags: ["Fé", "Antigo Testamento", "Esperança"],
    topics: [
      {
        id: "v1",
        title: "1. O vento contrário é parte do plano",
        content:
          "• Deus enviou o vento forte e oriental durante toda a noite (Êx 14:21).\n• O vento que incomoda é o mesmo que trabalha a nosso favor.\n• Versículo de apoio: Romanos 8:28.",
      },
      {
        id: "v2",
        title: "2. O vento que afasta a água",
        content:
          "• O vento dividiu as águas e secou o leito do mar.\n• O que parecia uma barreira intransponível torna-se terra seca.\n• Ilustração: o que parecia atrasar sua vida é o que está preparando o seu solo.",
      },
      {
        id: "v3",
        title: "3. Avançar no meio da noite",
        content:
          "• Os filhos de Israel entraram pelo meio do mar em seco.\n• O milagre exige o passo de fé sob o barulho do vento.\n• Apelo: você está disposto a marchar sob o vento contrário?",
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "seed-salvacao",
    title: "Do Vale dos Ossos Secos à Vida",
    baseVerse: "Ezequiel 37:1-10",
    theme: "A salvação que ressuscita o que estava morto",
    introduction:
      "Deus levou Ezequiel a um vale cheio de ossos secos e fez uma pergunta impossível: 'Poderão estes ossos viver?'. A resposta revela o poder restaurador da salvação.",
    conclusion:
      "Nenhuma situação está seca demais para o sopro de Deus. Onde havia morte, a Palavra e o Espírito trazem vida. Entregue hoje seus ossos secos a Ele e levante-se como parte do grande exército do Senhor.",
    appeal:
      "Se a sua esperança se secou e você precisa do sopro de ressurreição sobre a sua família ou seu coração, venha ao altar hoje. Deus está soprando vida agora!",
    tags: ["Salvação", "Antigo Testamento"],
    topics: [
      {
        id: "s1",
        title: "1. O diagnóstico: ossos muito secos",
        content:
          "• A condition humana sem Deus (v.2).\n• Não havia vida, nem movimento, nem esperança natural.",
      },
      {
        id: "s2",
        title: "2. A profecia: fala à Palavra",
        content:
          "• Ezequiel profetiza sobre os ossos (v.4).\n• A salvação vem pela proclamação da Palavra (Rm 10:17).",
      },
      {
        id: "s3",
        title: "3. O sopro: vida pelo Espírito",
        content:
          "• O Espírito entra e eles se levantam, um grande exército (v.10).\n• Apelo à salvação e à entrega ao sopro de Deus.",
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: "seed-familia",
    title: "Casa Edificada na Rocha",
    baseVerse: "Mateus 7:24-25",
    theme: "Princípios para uma família firmada em Deus",
    introduction:
      "Toda família enfrenta ventos e enxurradas. A diferença não está em evitar as crises, mas no alicerce sobre o qual a casa foi construída. Vamos descobrir como edificar sobre a Rocha.",
    conclusion:
      "A casa que permanece não é a que nunca enfrentou tempestade, mas a que foi construída sobre a Rocha. Hoje é dia de revisar o fundamento da sua família: ouvir e praticar a Palavra de Cristo, todos os dias.",
    appeal:
      "Hoje é dia de firmar a sua casa na rocha. Se você decide redefinir as prioridades da sua família com base na obediência a Cristo, ore comigo hoje!",
    tags: ["Família", "Novo Testamento"],
    topics: [
      {
        id: "f1",
        title: "1. O fundamento certo",
        content:
          "• Ouvir E praticar a Palavra (v.24).\n• Famílias se constroem com obediência diária, não apenas com boas intenções.",
      },
      {
        id: "f2",
        title: "2. As provas virão",
        content:
          "• Chuva, rios e ventos sobre as duas casas.\n• A crise revela o fundamento — não o cria.",
      },
      {
        id: "f3",
        title: "3. A casa que permanece",
        content:
          "• A estabilidade é fruto da escolha do alicerce.\n• Apelo: que fundamento sua família tem hoje?",
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: "seed-fe",
    title: "A Âncora da Alma",
    baseVerse: "Hebreus 6:19",
    theme: "Uma fé que permanece firme em meio à tempestade",
    introduction:
      "Existem momentos em que tudo ao nosso redor parece balançar. A fé, porém, é a âncora que segura a alma quando o mar revolta. Hoje veremos como ancorar nossa confiança naquilo que não se move.",
    conclusion:
      "A tempestade passa, mas a âncora permanece. Não confie no que se move ao seu redor; confie naquele que está além do véu. Lance sua âncora em Cristo hoje e descanse: sua alma está segura.",
    appeal:
      "Se a sua alma tem andado agitada pelas tempestades, venha fixar a sua âncora em Cristo hoje. Encontre descanso e segurança total!",
    tags: ["Fé", "Esperança"],
    topics: [
      {
        id: "t1",
        title: "1. A tempestade é real",
        content:
          "• Reconhecer a dor não é falta de fé.\n• Os discípulos no barco (Marcos 4:37-38).\n• Ilustração: o navegador não nega a tempestade, ele confia na âncora.",
      },
      {
        id: "t2",
        title: "2. A âncora é firme e segura",
        content:
          "• A esperança como âncora 'firme e segura' (Hb 6:19).\n• Ela penetra além do véu — está presa em Cristo, não nas circunstâncias.\n• Versículo de apoio: Salmos 62:6.",
      },
      {
        id: "t3",
        title: "3. Lançar a âncora todos os dias",
        content:
          "• Decisão diária de confiar.\n• Oração + Palavra como o ato de lançar a âncora.\n• Apelo: onde você está ancorado hoje?",
      },
    ],
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
  },
];

function normalize(sermons: Sermon[]): Sermon[] {
  return sermons.map((s) => ({ ...s, conclusion: s.conclusion ?? "", deleted: s.deleted ?? false }));
}

function load(): Sermon[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return normalize(JSON.parse(raw) as Sermon[]);
  } catch {
    return SEED;
  }
}

function persist(sermons: Sermon[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
}

export function useSermons() {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<
    "idle" | "syncing" | "success" | "error" | "offline" | "not_configured"
  >("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Carregar esboços e data do último sync ao iniciar
  useEffect(() => {
    const all = load();
    setSermons(all.filter((s) => !s.deleted));
    setLoaded(true);

    const last = window.localStorage.getItem("pregadynamic.last_synced_at");
    if (last) setLastSyncedAt(Number(last));
  }, []);

  const triggerSync = useCallback(async (customList?: Sermon[]) => {
    const syncCode = getSyncCode();
    const config = getSupabaseConfig();
    if (!syncCode || !config) {
      setSyncStatus("not_configured");
      return;
    }

    setSyncStatus("syncing");
    try {
      const listToSync = customList || load();
      const { syncedSermons } = await syncSermonsWithCloud(listToSync);

      persist(syncedSermons);
      setSermons(syncedSermons.filter((s) => !s.deleted));
      setSyncStatus("success");
      const now = Date.now();
      setLastSyncedAt(now);
      window.localStorage.setItem("pregadynamic.last_synced_at", String(now));
    } catch (err) {
      console.error("Erro na sincronização:", err);
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setSyncStatus("offline");
      } else {
        setSyncStatus("error");
      }
    }
  }, []);

  // Iniciar sincronização automática após carregar, se configurado
  useEffect(() => {
    if (loaded) {
      const syncCode = getSyncCode();
      if (syncCode) {
        triggerSync();
      } else {
        setSyncStatus("not_configured");
      }
    }
  }, [loaded, triggerSync]);

  const saveSermon = useCallback((sermon: Sermon) => {
    const all = load();
    const updated = { ...sermon, updatedAt: Date.now(), deleted: false };
    const exists = all.some((s) => s.id === sermon.id);
    const next = exists
      ? all.map((s) => (s.id === sermon.id ? updated : s))
      : [updated, ...all];

    persist(next);
    setSermons(next.filter((s) => !s.deleted));
    triggerSync(next);
  }, [triggerSync]);

  const deleteSermon = useCallback((id: string) => {
    const all = load();
    const next = all.map((s) =>
      s.id === id ? { ...s, deleted: true, updatedAt: Date.now() } : s,
    );

    persist(next);
    setSermons(next.filter((s) => !s.deleted));
    triggerSync(next);
  }, [triggerSync]);

  return { sermons, loaded, saveSermon, deleteSermon, syncStatus, lastSyncedAt, triggerSync };
}

export function getSermon(id: string): Sermon | undefined {
  return load().find((s) => s.id === id && !s.deleted);
}
