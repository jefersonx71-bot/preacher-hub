import { useCallback, useEffect, useState } from "react";

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
  tags: string[];
  topics: Topic[];
  createdAt: number;
  updatedAt: number;
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
    tags: [],
    topics: [{ id: uid(), title: "1. Primeiro ponto", content: "" }],
    createdAt: now,
    updatedAt: now,
  };
}

const SEED: Sermon[] = [
  {
    id: "seed-fe",
    title: "A Âncora da Alma",
    baseVerse: "Hebreus 6:19",
    theme: "Uma fé que permanece firme em meio à tempestade",
    introduction:
      "Existem momentos em que tudo ao nosso redor parece balançar. A fé, porém, é a âncora que segura a alma quando o mar revolta. Hoje veremos como ancorar nossa confiança naquilo que não se move.",
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
  {
    id: "seed-familia",
    title: "Casa Edificada na Rocha",
    baseVerse: "Mateus 7:24-25",
    theme: "Princípios para uma família firmada em Deus",
    introduction:
      "Toda família enfrenta ventos e enxurradas. A diferença não está em evitar as crises, mas no alicerce sobre o qual a casa foi construída. Vamos descobrir como edificar sobre a Rocha.",
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
    id: "seed-salvacao",
    title: "Do Vale dos Ossos Secos à Vida",
    baseVerse: "Ezequiel 37:1-10",
    theme: "A salvação que ressuscita o que estava morto",
    introduction:
      "Deus levou Ezequiel a um vale cheio de ossos secos e fez uma pergunta impossível: 'Poderão estes ossos viver?'. A resposta revela o poder restaurador da salvação.",
    tags: ["Salvação", "Antigo Testamento"],
    topics: [
      {
        id: "s1",
        title: "1. O diagnóstico: ossos muito secos",
        content:
          "• A condição humana sem Deus (v.2).\n• Não havia vida, nem movimento, nem esperança natural.",
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
];

function load(): Sermon[] {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
      return SEED;
    }
    return JSON.parse(raw) as Sermon[];
  } catch {
    return SEED;
  }
}

function persist(sermons: Sermon[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sermons));
}

export function useSermons() {
  const [sermons, setSermons] = useState<Sermon[]>(SEED);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSermons(load());
    setLoaded(true);
  }, []);

  const saveSermon = useCallback((sermon: Sermon) => {
    setSermons((prev) => {
      const updated = { ...sermon, updatedAt: Date.now() };
      const exists = prev.some((s) => s.id === sermon.id);
      const next = exists
        ? prev.map((s) => (s.id === sermon.id ? updated : s))
        : [updated, ...prev];
      persist(next);
      return next;
    });
  }, []);

  const deleteSermon = useCallback((id: string) => {
    setSermons((prev) => {
      const next = prev.filter((s) => s.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { sermons, loaded, saveSermon, deleteSermon };
}

export function getSermon(id: string): Sermon | undefined {
  return load().find((s) => s.id === id);
}
