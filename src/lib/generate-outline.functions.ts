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
  tags: string[];
  topics: { title: string; content: string }[];
}

const SYSTEM_PROMPT = `Você é um assistente teológico especializado em homilética que ajuda pregadores a transformar anotações soltas em esboços de pregação claros, organizados e prontos para o púlpito.

A partir do texto fornecido (anotações, rascunho ou pregação completa do pregador), extraia e estruture um esboço inteligente:
- title: um título forte e memorável para a mensagem.
- baseVerse: o versículo base principal (ex: "Hebreus 6:19"). Se houver vários, escolha o central. Se nenhum for citado, sugira o mais adequado ao tema.
- theme: uma frase curta resumindo a ideia central.
- introduction: 2 a 4 frases que abrem a mensagem de forma envolvente.
- topics: de 2 a 5 tópicos. Cada tópico tem um título numerado (ex: "1. A tempestade é real") e um conteúdo com tópicos em bullets usando "• " e quebras de linha "\\n", incluindo referências bíblicas, ilustrações e aplicações quando possível.
- tags: 1 a 3 categorias APENAS desta lista: Fé, Família, Salvação, Antigo Testamento, Novo Testamento, Esperança, Oração, Graça.

Responda sempre em português do Brasil. Preserve a intenção e o conteúdo original do pregador, apenas organizando-o melhor. Use a ferramenta save_outline para retornar o resultado.`;

export const generateOutline = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<GeneratedOutline> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY não está configurada.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
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
                required: ["title", "baseVerse", "theme", "introduction", "tags", "topics"],
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
    if (response.status === 402) {
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
      tags: validTags,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  });
