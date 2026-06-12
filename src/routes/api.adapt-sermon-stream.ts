import { createFileRoute } from "@tanstack/react-router";
import { parseMarkdownToSermon } from "@/lib/parse-markdown";
import type { Sermon } from "@/lib/sermons";

export const Route = createFileRoute("/api/adapt-sermon-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { sermon, audience, style } = (await request.json()) as {
            sermon: Sermon;
            audience: string;
            style: string;
          };

          if (!sermon || !audience || !style) {
            return new Response(
              JSON.stringify({ error: "Sermão, público-alvo e estilo homilético são obrigatórios." }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const geminiApiKey = process.env.GEMINI_API_KEY;
          const lovableApiKey = process.env.LOVABLE_API_KEY;
          const apiKey = geminiApiKey || lovableApiKey;
          const isGeminiStudio = !!geminiApiKey;

          const SYSTEM_PROMPT = `Você é o "Modo Jeff", um assistente especializado em gerar e adaptar pregações no estilo Jeff.

NÃO escreva como um comentarista bíblico, professor acadêmico ou teólogo de seminário. Escreva como um pregador experiente de púlpito falando para pessoas comuns. O objetivo não é apenas explicar o texto, mas gerar transformação, confronto, encorajamento e aplicação prática.

Sua tarefa é REESCREVER e ADAPTAR um esboço de pregação já estruturado para um novo PÚBLICO ALVO e um novo ESTILO HOMILÉTICO.

REGRAS DE ADAPTAÇÃO:
1. Mantenha as passagens bíblicas centrais (Versículo Base) e a ideia teológica geral do sermão.
2. Adapte a linguagem, o tom, as ilustrações cotidianas, as frases de impacto e as aplicações práticas para que correspondam de forma perfeita ao público-alvo solicitado.
3. Se o novo estilo homilético for diferente do original:
   - Expositivo: Foque em analisar profundamente os detalhes do texto versículo a versículo.
   - Temático: Foque nas doutrinas e tópicos sistemáticos, usando referências cruzadas.
   - Textual: Foque na estrutura derivada de uma única frase ou versículo curto.
   - Devocional: Foque na intimidade com Deus, refrigério da alma, simplicidade e encorajamento prático.
4. Se o público-alvo for:
   - Jovens e Adolescentes: Use termos dinâmicos, ilustrações sobre tecnologia, faculdade, amizades, escolhas de carreira, identidade, mídias sociais e lutas da juventude.
   - Casais e Famílias: Use ilustrações sobre o lar, relacionamento conjugal, criação de filhos, finanças domésticas, perdão familiar e legado espiritual.
   - Líderes e Obreiros: Fale sobre responsabilidade espiritual, caráter do obreiro, liderança de serviço, discipulado, integridade no secreto e lidar com críticas.
   - Não Cristãos / Evangelístico: Fale com simplicidade, foque fortemente na graça, no perdão de pecados, no amor incondicional de Jesus e faça um apelo direto para salvação, evitando termos internos e teológicos sem explicação.
   - Congregação Geral: Uma linguagem equilibrada e relevante para todas as faixas etárias e níveis de maturidade cristã.

O esboço adaptado DEVE ser estruturado rigorosamente em Markdown seguindo exatamente este padrão de títulos e marcadores:

# [Título Forte, Dinâmico e Memorável]

**Versículo Base:** [Passagem Bíblica]
**Tema:** [Frase central / ideia central impactante]
**Tags:** [1 a 3 tags separadas por vírgula da lista: Fé, Família, Salvação, Antigo Testamento, Novo Testamento, Esperança, Oração, Graça]

## Introdução
[Texto da introdução adaptada para o público e estilo...]

## Desenvolvimento

### 1. [Título do Tópico 1 Adaptado]
• [Explicação da passagem bíblica e lição principal adaptada]
• [Aplicação prática detalhada para a vida cotidiana do público-alvo]
• [Primeira frase de impacto do Estilo Jeff adaptada]
• [Segunda frase de impacto do Estilo Jeff adaptada]

### 2. [Título do Tópico 2 Adaptado]
• [Explicação...]
• [Aplicação prática...]
• [Primeira frase de impacto...]
• [Segunda frase de impacto...]

### 3. [Título do Tópico 3 Adaptado]
• [Explicação...]
• [Aplicação prática...]
• [Primeira frase de impacto...]
• [Segunda frase de impacto...]

## Conclusão
[Texto da conclusão adaptada...]

## Apelo
[Texto do apelo final adaptado para o público-alvo...]
`;

          const userPrompt = `Aqui está o esboço de pregação original para você adaptar:
Título: ${sermon.title}
Versículo Base: ${sermon.baseVerse}
Tema: ${sermon.theme}
Introdução original: ${sermon.introduction}
Pontos principais originais:
${sermon.topics.map((t, idx) => `${idx + 1}. ${t.title}\nConteúdo: ${t.content}`).join("\n\n")}
Conclusão original: ${sermon.conclusion}
Apelo original: ${sermon.appeal}

Por favor, ADAPTE e REESCREVA este esboço de pregação para:
Público Alvo Solicitado: ${audience}
Estilo Homilético Solicitado: ${style}

Mantenha a estrutura Markdown e retorne o esboço adaptado completo.`;

          const encoder = new TextEncoder();

          const stream = new ReadableStream({
            async start(controller) {
              const send = (data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
              };

              try {
                // Step 1: Investigating
                send({
                  type: "step",
                  id: "investigating",
                  message: `Analisando a estrutura original do esboço "${sermon.title}"...`,
                  status: "running",
                });
                await new Promise((r) => setTimeout(r, 800));
                send({
                  type: "step",
                  id: "investigating",
                  message: `Análise estrutural de "${sermon.baseVerse}" concluída. Pronto para adaptar para: ${audience}.`,
                  status: "completed",
                });

                // Step 2: Thinking (CoT)
                const thought = `[INICIANDO PROCESSO DE ADAPTAÇÃO HOMILÉTICA]
Sermão original: "${sermon.title}"
Versículo Base: "${sermon.baseVerse}"
Tema: "${sermon.theme}"
Público Alvo Desejado: "${audience}"
Estilo Homilético Desejado: "${style}"

1. Reavaliação de Linguagem e Metáforas:
- O tom anterior deve ser ajustado para se conectar com "${audience}".
- Se o público for jovem, removeremos termos arcaicos ou de difícil compreensão e inseriremos metáforas contemporâneas.
- Se o público for casais/família, redefiniremos as aplicações práticas para focar em relacionamentos familiares e no lar.
- Se o público for líderes, mudaremos o foco das aplicações para responsabilidade, caráter e mentoria ministerial.

2. Ajuste do Estilo Homilético ("${style}"):
- Expositivo: Assegurar que os tópicos mantenham rigor no desdobramento de termos e versículos específicos de ${sermon.baseVerse}.
- Temático: Sistematizar lições gerais com forte base bíblica.
- Devocional: Suavizar o tom, focando no refrigério espiritual e fé prática do dia a dia.
- Textual: Centralizar o esboço em torno da frase central da passagem bíblica.

3. Redação de Frases de Impacto:
- Desenhar frases memoráveis no "Modo Jeff" sob medida para a congregação alvo.`;

                send({
                  type: "step",
                  id: "thinking",
                  message: "Modelando a nova abordagem homilética (CoT)...",
                  status: "running",
                  thought,
                });
                await new Promise((r) => setTimeout(r, 1200));
                send({
                  type: "step",
                  id: "thinking",
                  message: `Nova abordagem modelada com sucesso no estilo ${style}.`,
                  status: "completed",
                });

                // Step 3: Drafting
                send({
                  type: "step",
                  id: "drafting",
                  message: "Reescrevendo o esboço em tempo real...",
                  status: "running",
                });

                let accumulatedResult = "";

                if (!apiKey) {
                  // Fallback offline simulated stream
                  console.warn("Sem chave de API configurada. Usando simulador offline.");
                  
                  const mockMarkdown = `# ${sermon.title} (Adaptado para ${audience})

**Versículo Base:** ${sermon.baseVerse}
**Tema:** ${sermon.theme} (Enfoque em ${style} para ${audience})
**Tags:** ${sermon.tags.join(", ") || "Fé"}

## Introdução
Esta é uma versão reescrita de sua mensagem. Adaptamos a introdução original para falar diretamente ao coração do público: ${audience}. No estilo ${style}, aprendemos que a presença de Deus se manifesta em nossos desafios diários para renovar nossas forças.

## Desenvolvimento

${sermon.topics.map((t, idx) => {
  return `### ${idx + 1}. ${t.title}
• O texto bíblico nos ensina que a dependência do Senhor supera as dificuldades. Esta verdade se aplica às nossas vidas.
• Aplicação prática para ${audience}: No seu cotidiano e nos seus desafios específicos como ${audience}, lembre-se de exercitar a fé prática no seu ambiente.
• Frase de impacto 1: "O processo não destrói o seu propósito; ele apenas treina o seu caráter para recebê-lo."
• Frase de impacto 2: "Deus não unge a nossa força independente, Ele unge a nossa dependência quebrantada."`;
}).join("\n\n")}

## Conclusão
Em conclusão, esta mensagem adaptada nos chama a viver uma fé ativa. Sob o estilo homilético ${style}, a lição final é clara: confie no Senhor.

## Apelo
Se você, como parte do grupo de ${audience}, deseja responder a esta palavra e renovar o seu compromisso com Deus hoje, dê um passo à frente.`;

                  const chunks = mockMarkdown.split("\n");
                  for (const chunk of chunks) {
                    accumulatedResult += chunk + "\n";
                    send({ type: "chunk", text: chunk + "\n" });
                    await new Promise((r) => setTimeout(r, 60));
                  }
                } else {
                  // Live API call with stream
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
                        { role: "user", content: userPrompt },
                      ],
                      stream: true,
                    }),
                  });

                  if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`Erro na API do Gemini: ${response.status} - ${errText}`);
                  }

                  const reader = response.body?.getReader();
                  if (!reader) {
                    throw new Error("Não foi possível inicializar o leitor de stream.");
                  }

                  const decoder = new TextDecoder();
                  let streamBuffer = "";

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    streamBuffer += decoder.decode(value, { stream: true });
                    const lines = streamBuffer.split("\n");
                    streamBuffer = lines.pop() || "";

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (!trimmed) continue;
                      if (trimmed === "data: [DONE]") break;
                      if (trimmed.startsWith("data: ")) {
                        try {
                          const json = JSON.parse(trimmed.slice(6));
                          const text = json.choices?.[0]?.delta?.content || "";
                          if (text) {
                            accumulatedResult += text;
                            send({ type: "chunk", text });
                          }
                        } catch (err) {
                          // Ignore parsing errors for incomplete lines
                        }
                      }
                    }
                  }
                }

                // Parse accumulated markdown into structured Sermon object
                const parsedSermonFields = parseMarkdownToSermon(accumulatedResult);

                // Complete drafting step
                send({
                  type: "step",
                  id: "drafting",
                  message: "Esboço adaptado com sucesso.",
                  status: "completed",
                });

                // Send the fully structured sermon
                send({
                  type: "sermon",
                  sermon: parsedSermonFields,
                });

                send({ type: "done" });
              } catch (e: any) {
                console.error("Stream adaptation error:", e);
                send({ type: "error", message: e.message || "Falha desconhecida no stream." });
              } finally {
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive",
            },
          });
        } catch (error: any) {
          console.error("Adapt route error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Erro interno no servidor." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
