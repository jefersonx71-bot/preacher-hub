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
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY não está configurada.");
    }

    const userContent = [
      data.sermonTitle ? `Sermão: ${data.sermonTitle}` : null,
      data.baseVerse ? `Versículo base: ${data.baseVerse}` : null,
      `Tópico: ${data.topicTitle}`,
      data.topicContent ? `Conteúdo do tópico:\n${data.topicContent}` : null,
    ]
      .filter(Boolean)
      .join("\n");

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
    if (response.status === 402) {
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
