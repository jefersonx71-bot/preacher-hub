import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  term: z.string().trim().min(2).max(80),
});

export interface DictionaryEntry {
  term: string;
  meaning: string;
  summary: string;
  references: string[];
  study: string;
}

const SYSTEM_PROMPT = `Você é um dicionário bíblico e assistente de estudo para pregadores. Recebe uma palavra, nome ou termo (ex: "Abisai", "graça", "Hebrom") e produz um mini estudo claro e direto, útil para quando o pregador "der um branco" no púlpito.

Para o termo fornecido, retorne usando a ferramenta save_entry:
- term: o termo já com a grafia/capitalização correta (ex: "Abisai").
- meaning: o significado do nome ou uma definição curta do termo (1 frase). Se for nome próprio, inclua a etimologia/significado do nome quando conhecido.
- summary: 2 a 4 frases explicando quem é a pessoa ou o que é o conceito, com o contexto bíblico essencial.
- references: 1 a 5 referências bíblicas principais relacionadas (ex: "2 Samuel 23:18"). Apenas as referências, sem o texto.
- study: 3 a 5 frases de mini estudo devocional/homilético, destacando uma lição prática e aplicável que o pregador pode usar imediatamente.

Responda SEMPRE em português do Brasil. Se o termo não for claramente bíblico, dê a melhor explicação possível dentro de uma perspectiva cristã. Seja preciso e fiel ao texto bíblico.`;

export const lookupTerm = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<DictionaryEntry> => {
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
          { role: "user", content: `Termo: ${data.term}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_entry",
              description: "Salva o verbete do dicionário bíblico.",
              parameters: {
                type: "object",
                properties: {
                  term: { type: "string" },
                  meaning: { type: "string" },
                  summary: { type: "string" },
                  references: {
                    type: "array",
                    items: { type: "string" },
                  },
                  study: { type: "string" },
                },
                required: ["term", "meaning", "summary", "references", "study"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_entry" } },
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
      throw new Error("Não foi possível buscar o termo. Tente novamente.");
    }

    const result = await response.json();
    const toolCall = result?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("A IA não retornou um resultado válido. Tente novamente.");
    }

    const parsed = JSON.parse(toolCall.function.arguments) as DictionaryEntry;

    return {
      term: parsed.term?.trim() || data.term,
      meaning: parsed.meaning ?? "",
      summary: parsed.summary ?? "",
      references: Array.isArray(parsed.references) ? parsed.references.filter(Boolean) : [],
      study: parsed.study ?? "",
    };
  });
