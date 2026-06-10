import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_TAGS = [
  "Fé",
  "Família",
  "Salvação",
  "Antigo Testamento",
  "Novo Testamento",
  "Esperança",
  "Oração",
  "Graça",
] as const;

const inputSchema = z.object({
  text: z.string().trim().min(40).max(20000),
});

export interface GeneratedOutline {
  title: string;
  baseVerse: string;
  theme: string;
  introduction: string;
  conclusion: string;
  tags: string[];
  topics: { title: string; content: string }[];
}

const SYSTEM_PROMPT = `Você é um assistente teológico especializado em homilética que ajuda pregadores a transformar anotações soltas em esboços de pregação claros, organizados e prontos para o púlpito.

Estruture SEMPRE o esboço no formato clássico de três partes: INTRODUÇÃO → DESENVOLVIMENTO → CONCLUSÃO.

A partir do texto fornecido (anotações, rascunho ou pregação completa do pregador), extraia e estruture:
- title: um título forte e memorável para a mensagem.
- baseVerse: o versículo base principal (ex: "Hebreus 6:19"). Se houver vários, escolha o central. Se nenhum for citado, sugira o mais adequado ao tema.
- theme: uma frase curta resumindo a ideia central.
- introduction (INTRODUÇÃO): 2 a 4 frases que abrem a mensagem de forma envolvente, apresentando o tema e despertando interesse.
- topics (DESENVOLVIMENTO): de 2 a 5 tópicos que desenvolvem a mensagem. Cada tópico tem um título numerado (ex: "1. A tempestade é real") e um conteúdo com tópicos em bullets começando cada item com "• " e SEPARANDO cada item com uma quebra de linha real (Enter), nunca escrevendo a sequência de caracteres "\\n". Inclua referências bíblicas, ilustrações e aplicações quando possível.
- conclusion (CONCLUSÃO): 2 a 4 frases que recapitulam a ideia central, fecham a mensagem e fazem o apelo ou aplicação final ao ouvinte.
- tags: 1 a 3 categorias APENAS desta lista: Fé, Família, Salvação, Antigo Testamento, Novo Testamento, Esperança, Oração, Graça.

Responda sempre em português do Brasil. Preserve a intenção e o conteúdo original do pregador, apenas organizando-o melhor nesse formato. Use a ferramenta save_outline para retornar o resultado.`;

export const generateOutline = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<GeneratedOutline> => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const apiKey = geminiApiKey || lovableApiKey;
    if (!apiKey) {
      console.warn("Nenhuma chave de API (GEMINI_API_KEY ou LOVABLE_API_KEY) configurada. Usando dados de preview simulados.");
      return new Promise((resolve) => {
        setTimeout(() => {
          const lowerText = data.text.toLowerCase();
          
          if (lowerText.includes("bartimeu") || lowerText.includes("cego") || lowerText.includes("jericó") || lowerText.includes("jerico")) {
            resolve({
              title: "O Clamor de Bartimeu: Vencendo Barreiras para Ver Jesus",
              baseVerse: "Marcos 10:46-52",
              theme: "Como a persistência, o descarte de velhas vestes e o clamor de fé movem o coração de Deus.",
              introduction: "Às margens do caminho de Jericó, um homem cego e mendigo chamado Bartimeu clama pela intervenção de Jesus. Embora a multidão tente calá-lo, seu clamor atrai a atenção do Mestre. Hoje aprenderemos que nenhuma barreira social ou limitação física pode impedir um coração resoluto e cheio de fé de alcançar o milagre.",
              conclusion: "Jesus ainda passa hoje ao nosso lado. Não permita que o orgulho ou as vozes da multidão o calem. Lance fora a sua capa da autocompaixão, clame pela misericórdia de Cristo e caminhe na luz da Sua salvação.",
              tags: ["Fé", "Salvação", "Oração"],
              topics: [
                {
                  title: "1. Clamando acima das vozes da multidão",
                  content: "• Bartimeu não se calou quando mandaram ele silenciar (Marcos 10:48).\n• Oposição externa testa a profundidade do nosso desejo por mudança.\n• Clame com mais força: 'Jesus, Filho de Davi, tem misericórdia de mim!'."
                },
                {
                  title: "2. Lançando fora a capa da velha identidade",
                  content: "• Ele jogou fora a capa de mendigo para ir até Jesus (Marcos 10:50).\n• A capa representava seu sustento legal, sua zona de conforto e sua antiga limitação.\n• Aplicação homilética: o que você precisa abandonar hoje para responder ao chamado de Cristo?"
                },
                {
                  title: "3. Uma fé que se traduz em ação",
                  content: "• Jesus pergunta: 'O que queres que eu te faça?' demonstrando a importância de especificar nossa petição.\n• O milagre restaura a visão e o transforma de um mendigo à beira do caminho em um discípulo que segue a Jesus na estrada.\n• A fé salvadora produz direção e discipulado contínuo."
                }
              ]
            });
            return;
          }

          resolve({
            title: "Esboço Gerado a partir do Texto",
            baseVerse: "Filipenses 4:13",
            theme: "A força que vem de Deus para vencer todas as circunstâncias.",
            introduction: "Muitas vezes nos sentimos fracos e incapazes diante dos desafios da vida. No entanto, a Palavra de Deus nos revela uma fonte inesgotável de poder e graça. Hoje aprenderemos como depender totalmente Daquele que nos fortalece.",
            conclusion: "Não dependa de suas próprias forças ou recursos humanos. Quando você se render a Cristo e confessar sua dependência Dele, Ele derramará o Seu poder aperfeiçoado na sua fraqueza. Busque-O hoje mesmo.",
            tags: ["Fé", "Graça", "Esperança"],
            topics: [
              {
                title: "1. O perigo da autossuficiência",
                content: "• Achar que podemos vencer pelas nossas próprias forças.\n• O exemplo de Pedro ao tentar andar sobre as águas confiando em si mesmo.\n• Versículo de apoio: Provérbios 3:5-6."
              },
              {
                title: "2. A força que vem de cima",
                content: "• O poder de Deus se aperfeiçoa na nossa fraqueza (2 Coríntios 12:9).\n• A oração como chave para receber o fortalecimento do Espírito Santo.\n• Ilustração: o galho que precisa estar ligado à videira para dar frutos."
              },
              {
                title: "3. Contentamento em qualquer situação",
                content: "• Paulo aprendeu a viver contente tanto na fartura quanto na escassez.\n• A paz de Deus guarda o nosso coração das preocupações.\n• Apelo prático: entregue sua ansiedade a Deus hoje."
              }
            ]
          });
        }, 1500);
      });
    }

    const isGeminiStudio = !!geminiApiKey;
    const baseUrl = isGeminiStudio
      ? "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const modelName = isGeminiStudio
      ? "gemini-1.5-flash"
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
          { role: "user", content: data.text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_outline",
              description: "Salva o esboço de pregação estruturado.",
              parameters: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  baseVerse: { type: "string" },
                  theme: { type: "string" },
                  introduction: { type: "string" },
                  conclusion: { type: "string" },
                  tags: {
                    type: "array",
                    items: { type: "string", enum: ALLOWED_TAGS as unknown as string[] },
                  },
                  topics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" },
                      },
                      required: ["title", "content"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["title", "baseVerse", "theme", "introduction", "conclusion", "tags", "topics"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_outline" } },
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
      throw new Error("Não foi possível gerar o esboço. Tente novamente.");
    }

    const result = await response.json();
    const toolCall = result?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("A IA não retornou um esboço válido. Tente novamente.");
    }

    const parsed = JSON.parse(toolCall.function.arguments) as GeneratedOutline;
    const validTags = parsed.tags?.filter((t) => (ALLOWED_TAGS as readonly string[]).includes(t)) ?? [];

    return {
      title: parsed.title ?? "",
      baseVerse: parsed.baseVerse ?? "",
      theme: parsed.theme ?? "",
      introduction: parsed.introduction ?? "",
      conclusion: parsed.conclusion ?? "",
      tags: validTags,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  });
