import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  sermonTitle: z.string().trim().max(200).optional(),
  baseVerse: z.string().trim().max(120).optional(),
  topicTitle: z.string().trim().min(2).max(200),
  topicContent: z.string().trim().max(4000).optional(),
});

export interface EnrichResult {
  illustrations: string[];
  examples: string[];
  references: string[];
}

const SYSTEM_PROMPT = `Você é um assistente homilético para pregadores. Recebe um tópico de um sermão (título e conteúdo) e gera material para enriquecer a pregação daquele ponto.

Use a ferramenta save_enrichment para retornar:
- illustrations: 2 a 3 ilustrações ou histórias (metáforas, analogias do cotidiano, casos) que ajudem a comunicar a ideia do tópico de forma vívida. Cada item deve ser uma ilustração completa em 2 a 4 frases.
- examples: 2 a 3 exemplos práticos e aplicáveis à vida do ouvinte (situações reais, aplicações concretas). Cada item em 1 a 3 frases.
- references: 3 a 6 referências bíblicas adicionais que reforcem o tópico (ex: "Romanos 8:28"). Apenas as referências, sem o texto.

Responda SEMPRE em português do Brasil. Seja fiel ao texto bíblico, criativo e relevante ao tópico fornecido.`;

export const enrichTopic = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<EnrichResult> => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const apiKey = geminiApiKey || lovableApiKey;
    if (!apiKey) {
      console.warn("Nenhuma chave de API (GEMINI_API_KEY ou LOVABLE_API_KEY) configurada. Usando dados de preview simulados.");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            illustrations: [
              `Ilustração para "${data.topicTitle}": Pense em um construtor que escolhe cavar fundo até encontrar a rocha firme antes de colocar o primeiro tijolo. Embora demore mais, sua obra permanece intacta quando a tempestade chega.`,
              `Outra analogia útil: Um farol construído sobre um penhasco de granito resiste a séculos de ondas violentas, enquanto uma cabana na areia da praia é levada na primeira maré alta.`
            ],
            examples: [
              `Aplicação prática: Avalie quais hábitos diários consomem seu tempo. Eles estão alinhados com a vontade de Deus ou são apenas distrações passageiras?`,
              `Exemplo no cotidiano: Ao tomar uma decisão importante na família, consulte a Palavra de Deus em oração antes de seguir a opinião popular ou as pressões externas.`
            ],
            references: [
              "Mateus 7:24",
              "Salmo 127:1",
              "1 Coríntios 3:11",
              "Lucas 6:48"
            ]
          });
        }, 1200);
      });
    }

    const userContent = [
      data.sermonTitle ? `Sermão: ${data.sermonTitle}` : null,
      data.baseVerse ? `Versículo base: ${data.baseVerse}` : null,
      `Tópico: ${data.topicTitle}`,
      data.topicContent ? `Conteúdo do tópico:\n${data.topicContent}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const isGeminiStudio = !!geminiApiKey;
    const baseUrl = isGeminiStudio
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const modelName = isGeminiStudio
      ? "gemini-2.5-flash"
      : "google/gemini-3-flash-preview";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_enrichment",
              description: "Salva o material de enriquecimento do tópico.",
              parameters: {
                type: "object",
                properties: {
                  illustrations: { type: "array", items: { type: "string" } },
                  examples: { type: "array", items: { type: "string" } },
                  references: { type: "array", items: { type: "string" } },
                },
                required: ["illustrations", "examples", "references"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_enrichment" } },
      }),
    });

    if (response.status === 429) {
      throw new Error("Limite de requisições excedido. Aguarde um momento e tente novamente.");
    }
    if (response.status === 402 && !isGeminiStudio) {
      throw new Error("Créditos de IA esgotados. Adicione créditos no seu workspace Lovable.");
    }
    if (!response.ok) {
      const body = await response.text();
      console.error("AI gateway error:", response.status, body);
      throw new Error("Não foi possível enriquecer o tópico. Tente novamente.");
    }

    const result = await response.json();
    const toolCall = result?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("A IA não retornou um resultado válido. Tente novamente.");
    }

    const parsed = JSON.parse(toolCall.function.arguments) as EnrichResult;

    return {
      illustrations: Array.isArray(parsed.illustrations) ? parsed.illustrations.filter(Boolean) : [],
      examples: Array.isArray(parsed.examples) ? parsed.examples.filter(Boolean) : [],
      references: Array.isArray(parsed.references) ? parsed.references.filter(Boolean) : [],
    };
  });

const expandInputSchema = z.object({
  topicTitle: z.string().trim().min(2).max(200),
  currentContent: z.string().trim().max(4000),
  theme: z.string().trim().max(200).optional(),
  baseVerse: z.string().trim().max(120).optional(),
});

export const expandTopicContent = createServerFn({ method: "POST" })
  .inputValidator(expandInputSchema)
  .handler(async ({ data }): Promise<{ expandedContent: string }> => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const apiKey = geminiApiKey || lovableApiKey;
    if (!apiKey) {
      console.warn("Nenhuma chave de API (GEMINI_API_KEY ou LOVABLE_API_KEY) configurada. Usando simulação local.");
      return new Promise((resolve) => {
        setTimeout(() => {
          const titleLower = data.topicTitle.toLowerCase();
          let topicSpecificAdditions: string[] = [];

          if (titleLower.includes("vento") || titleLower.includes("mar") || titleLower.includes("caminho")) {
            topicSpecificAdditions = [
              `• Ilustração de apoio: Pense no vento oriental que soprou a noite inteira sobre o mar Vermelho. O que parecia uma barreira intransponível na verdade revelou o leito seco para caminhar.`,
              `• Aplicação homilética: Pare de lutar contra o vento em suas próprias forças. Ore para compreender qual caminho Deus está abrindo por meio das oposições.`,
              `• Referência complementar para a pregação: Salmos 107:29 ("Faz cessar a tempestade, e acalmam-se as suas ondas").`,
              `• Estudo teológico prático: O vento forte não veio para destruir, mas para separar a água e preparar o solo do milagre.`
            ];
          } else if (titleLower.includes("ossos") || titleLower.includes("vale") || titleLower.includes("diagnóstico") || titleLower.includes("vida")) {
            topicSpecificAdditions = [
              `• Ilustração de apoio: Imagine o vale silencioso e desolador de ossos secos. A restauração não começa com uma mudança externa imediata, mas com o som do vento de Deus soprando vida.`,
              `• Aplicação prática: Identifique qual área de sua vida (finanças, família, ministério) parece totalmente seca e declare a ressurreição por meio da Palavra.`,
              `• Referência complementar: Romanos 4:17 (Aquele que dá vida aos mortos e chama à existência as coisas que não existem).`,
              `• Exemplo devocional: A salvação é o milagre que ressuscita o pecador morto e o levanta como soldado no exército do Senhor.`
            ];
          } else if (titleLower.includes("casa") || titleLower.includes("rocha") || titleLower.includes("fundamento") || titleLower.includes("alicerce")) {
            topicSpecificAdditions = [
              `• Ilustração sobre fundamento: O alicerce de uma casa fica sob a terra, invisível a quem passa. Assim é a nossa vida com Deus: as orações secretas sustentam o caráter público.`,
              `• Aplicação prática: Ao tomar decisões importantes na família, certifique-se de fundamentar suas escolhas na Palavra eterna, e não nos sentimentos passageiros.`,
              `• Referência complementar: Lucas 6:48 (Cavou profundo e pôs o alicerce sobre a rocha).`,
              `• Pensamento prático: A tempestade cai sobre ambas as casas. A diferença entre a ruína e a permanência é unicamente o alicerce escolhido.`
            ];
          } else if (titleLower.includes("âncora") || titleLower.includes("alma") || titleLower.includes("tempestade") || titleLower.includes("firme")) {
            topicSpecificAdditions = [
              `• Ilustração da âncora: A âncora do navio não é lançada dentro do barco, mas no fundo do mar, onde não pode ser vista. Lançar a âncora da alma é prender a esperança em Cristo.`,
              `• Aplicação prática para a alma: Quando a ansiedade bater à porta, declare a si mesmo que a sua âncora está fixa Naquele que não muda.`,
              `• Referência complementar: Salmo 62:6 (Só ele é a minha rocha e a minha salvação; é a minha defesa; não serei abalado).`,
              `• Analogia homilética: O mar pode estar revolto e o vento soprando forte, mas o navio ancorado em rocha firme não será levado pela correnteza.`
            ];
          } else {
            topicSpecificAdditions = [
              `• Ilustração aplicável a "${data.topicTitle}": Pense em uma semente plantada na terra. Ela precisa de tempo no escuro e sob pressão para que a sua casca se rompa e revele o fruto.`,
              `• Exemplo prático para "${data.topicTitle}": Comece aplicando esta verdade no seu relacionamento familiar mais próximo, demonstrando paciência e amor prático.`,
              `• Referência bíblica complementar: Salmo 119:105 ("Lâmpada para os meus pés é tua palavra, e luz para o meu caminho").`,
              `• Lição homilética central: O impacto desta mensagem em "${data.topicTitle}" é nos chamar a dar o primeiro passo de obediência prática hoje.`
            ];
          }

          const lines = data.currentContent.split("\n").map(l => l.trim()).filter(Boolean);
          const nextIndex = Math.max(0, lines.length) % topicSpecificAdditions.length;
          const nextBullet = topicSpecificAdditions[nextIndex];
          
          const updated = [...lines, nextBullet].join("\n");
          resolve({ expandedContent: updated });
        }, 1200);
      });
    }

    const SYSTEM_PROMPT = `Você é um assessor teológico e homilético para pregadores.
Recebe o título de um tópico, o seu conteúdo atual (que está em formato de bullets com "• ") e o contexto geral do sermão (tema e versículo).
Sua missão é expandir esse conteúdo para torná-lo mais rico, profundo e pronto para a pregação.
Você deve manter o conteúdo atual exatamente como está e adicionar 1 novo bullet ("• ") muito rico contendo uma ilustração homilética profunda, um exemplo prático cotidiano ou uma referência bíblica comentada relevante.
Retorne APENAS o conteúdo final completo em formato de bullets separados por quebra de linha real. Não inclua introduções, explicações ou caracteres especiais além de "• ".`;

    const isGeminiStudio = !!geminiApiKey;
    const baseUrl = isGeminiStudio
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const modelName = isGeminiStudio
      ? "gemini-2.5-flash"
      : "google/gemini-3-flash-preview";

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Contexto do Sermão: Tema: ${data.theme || "N/A"}, Versículo: ${data.baseVerse || "N/A"}\nTópico: ${data.topicTitle}\nConteúdo Atual:\n${data.currentContent}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("Não foi possível expandir o tópico.");
    }

    const result = await response.json();
    const text = result?.choices?.[0]?.message?.content || "";
    return { expandedContent: text.trim() };
  });
