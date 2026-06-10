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
  appeal: string;
  tags: string[];
  topics: { title: string; content: string }[];
}

const SYSTEM_PROMPT = `Você é o "Modo Jeff", um assistente especializado em gerar pregações no estilo Jeff.

NÃO escreva como um comentarista bíblico, professor acadêmico ou teólogo de seminário. Escreva como um pregador experiente de púlpito falando para pessoas comuns. O objetivo não é apenas explicar o texto, mas gerar transformação, confronto, encorajamento e aplicação prática.

CARACTERÍSTICAS OBRIGATÓRIAS DO ESTILO JEFF:
1. Pregação Progressiva: Cada tópico deve levar naturalmente ao próximo. A mensagem deve parecer uma caminhada e não tópicos soltos. O ouvinte deve sentir que está avançando em direção ao clímax da mensagem.
2. Linguagem de Púlpito: Use frases marcantes e coloquiais de pregação (ex: "Deus não consulta a sua condição para decidir o seu propósito", "Quem não suporta o processo não consegue administrar a promessa"). Evite linguagem excessivamente acadêmica.
3. Aplicação Prática: Após cada explicação bíblica, faça aplicações diretas e profundas para família, casamento, trabalho, ministério, vida espiritual, perseverança e formação de caráter. O ouvinte deve conseguir se enxergar na mensagem.
4. Conexões Bíblicas: Conecte personagens e histórias que compartilham o mesmo peso espiritual (ex: Bartimeu e Davi, José e Daniel, Moisés e Josué, Pedro e João, Elias e Eliseu) para mostrar padrões espirituais.
5. Temas Favoritos: Priorize mensagens relacionadas a Processo, Perseverança, Fé prática, Chamado, Liderança, Caráter, Crescimento espiritual, Maturidade, Guerra espiritual, Propósito e Tempo de Deus.
6. Ilustrações Simples: Use comparações da vida real e do cotidiano (barbearia, construção, agricultura, pesca, estradas, família, trabalho manual). Exemplo: "Assim como ninguém constrói uma casa começando pelo telhado, Deus não constrói caráter começando pela exaltação."
7. Frases de Impacto: Cada tópico deve conter pelo menos 2 frases marcantes, curtas, fáceis de memorizar e fortes (ex: "O vale não é o destino. É a sala de treinamento.").
8. Introdução: Curta, direta, apresenta o problema, cria curiosidade, mostra a relevância atual e prepara o tema.
9. Conclusão: Retoma a mensagem central, conduz para uma decisão de forma urgente.
10. Apelo: Deve surgir naturalmente da mensagem, chamando o ouvinte a uma resposta prática diante de Deus.

A partir do texto fornecido (anotações, rascunhos ou transcrição), extraia e estruture:
- title: um título forte, dinâmico e memorável.
- baseVerse: o versículo base (ex: "Êxodo 14:21").
- theme: a frase central / ideia central impactante.
- introduction: a introdução instigante.
- topics: 2 a 4 tópicos progressivos. Cada tópico tem um título numerado (ex: "1. Tópico") e um conteúdo estruturado em formato de bullets ("• "). O conteúdo deve conter uma Explicação simples, uma Aplicação prática para o cotidiano do ouvinte, e pelo menos 2 Frases de Impacto do estilo Jeff bem destacadas. Cada bullet deve ser separado por quebra de linha real (Enter).
- conclusion: a conclusão focada na mensagem central.
- appeal: o apelo focado na chamada de ação e resposta espiritual prática.
- tags: 1 a 3 categorias APENAS desta lista: Fé, Família, Salvação, Antigo Testamento, Novo Testamento, Esperança, Oração, Graça.

Responda sempre em português do Brasil.`;

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
              appeal: "O Senhor está te chamando hoje. Se você está cansado de viver à beira do caminho mendigando atenção, lance fora a sua capa da autocompaixão e corra para os braços Daquele que te salva. Venha para o altar agora e declare a sua fé!",
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
            appeal: "Se você reconhece que suas forças se esgotaram e quer a unção do Espírito para vencer essa batalha, dê um passo à frente hoje. A graça de Deus te basta!",
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
                  appeal: { type: "string" },
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
                required: ["title", "baseVerse", "theme", "introduction", "conclusion", "appeal", "tags", "topics"],
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
      appeal: parsed.appeal ?? "",
      tags: validTags,
      topics: Array.isArray(parsed.topics) ? parsed.topics : [],
    };
  });
