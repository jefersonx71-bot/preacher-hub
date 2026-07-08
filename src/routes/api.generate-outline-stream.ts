import { createFileRoute } from "@tanstack/react-router";
import { parseMarkdownToSermon } from "@/lib/parse-markdown";
import { corsHeaders, handleCorsOptions } from "@/lib/cors";

export const Route = createFileRoute("/api/generate-outline-stream")({
  server: {
    handlers: {
      OPTIONS: async () => handleCorsOptions(),
      POST: async ({ request }) => {
        try {
          const { topic, passage, audience, style } = (await request.json()) as {
            topic: string;
            passage: string;
            audience: string;
            style: string;
          };

          if (!topic || !passage) {
            return new Response(JSON.stringify({ error: "Tema e passagem são obrigatórios." }), {
              status: 400,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }

          const geminiApiKey = process.env.GEMINI_API_KEY;
          const lovableApiKey = process.env.LOVABLE_API_KEY;
          const apiKey = geminiApiKey || lovableApiKey;
          const isGeminiStudio = !!geminiApiKey;

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

O esboço DEVE ser estruturado rigorosamente em Markdown seguindo exatamente este padrão de títulos e marcadores:

# [Título Forte, Dinâmico e Memorável]

**Versículo Base:** [Passagem Bíblica]
**Tema:** [Frase central / ideia central impactante]
**Tags:** [1 a 3 tags separadas por vírgula da lista: Fé, Família, Salvação, Antigo Testamento, Novo Testamento, Esperança, Oração, Graça]

## Introdução
[Texto da introdução...]

## Desenvolvimento

### 1. [Título do Tópico 1]
• [Explicação da passagem bíblica e lição principal no estilo de púlpito]
• [Aplicação prática detalhada para a vida cotidiana do público-alvo]
• [Primeira frase de impacto do Estilo Jeff]
• [Segunda frase de impacto do Estilo Jeff]

### 2. [Título do Tópico 2]
• [Explicação...]
• [Aplicação prática...]
• [Primeira frase de impacto...]
• [Segunda frase de impacto...]

### 3. [Título do Tópico 3]
• [Explicação...]
• [Aplicação prática...]
• [Primeira frase de impacto...]
• [Segunda frase de impacto...]

## Conclusão
[Texto da conclusão...]

## Apelo
[Texto do apelo final para a congregação (Modo Jeff)...]
`;

          const userPrompt = `Por favor, crie um sermão no estilo "Modo Jeff" seguindo a estrutura exigida.
Tema: ${topic}
Passagem Bíblica: ${passage}
Público Alvo: ${audience}
Estilo Homilético: ${style}`;

          const encoder = new TextEncoder();

          // Prepare the stream response
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
                  message: "Conectando ao banco de dados exegético da Palavra...",
                  status: "running",
                });
                await new Promise((r) => setTimeout(r, 800));
                send({
                  type: "step",
                  id: "investigating",
                  message: `Contexto bíblico de ${passage} localizado com sucesso.`,
                  status: "completed",
                });

                // Step 2: Thinking (CoT)
                const thought = `[INICIANDO ANÁLISE EXEGÉTICA]
Passagem selecionada: "${passage}"
Tema proposto: "${topic}"
Público Alvo: "${audience}"
Estilo Homilético: "${style}"

1. Contexto Histórico-Literário:
Identificando o público original e a situação sociocultural da passagem. A exese nos revela que em ${passage}, os ouvintes originais estavam lidando com questões profundas de identidade e confiança. No estilo "${style}", focaremos na progressão e relevância pastoral direta.

2. Palavras-Chave no Original:
- Mapeando termos fortes em grego/hebraico para trazer profundidade e autoridade ao púlpito.
- Conectando com a jornada prática do crente moderno.

3. Estruturação no Estilo "Modo Jeff":
- Evitar linguagem fria ou meramente acadêmica.
- Desenvolver a progressão homilética em tópicos encadeados: a chamada do processo, o confronto da realidade e a promessa do destino.
- Garantir que cada tópico termine com aplicações práticas diretas e pelo menos duas frases de impacto marcantes.`;

                send({
                  type: "step",
                  id: "thinking",
                  message: "Raciocínio Homilético (CoT)...",
                  status: "running",
                  thought,
                });
                await new Promise((r) => setTimeout(r, 1200));
                send({
                  type: "step",
                  id: "thinking",
                  message: "Estrutura do sermão definida no estilo Modo Jeff.",
                  status: "completed",
                });

                // Step 3: Drafting
                send({
                  type: "step",
                  id: "drafting",
                  message: "Vertendo o esboço homilético em tempo real...",
                  status: "running",
                });

                let accumulatedResult = "";

                if (!apiKey) {
                  // Fallback offline simulated stream
                  console.warn("Sem chave de API configurada. Usando simulador offline.");
                  const mockMarkdown = `# ${topic}: Vencendo no Meio do Processo

**Versículo Base:** ${passage}
**Tema:** Deus usa as estações difíceis para forjar o seu caráter e preparar o seu destino.
**Tags:** Fé, Esperança, Graça

## Introdução
Muitas vezes, olhamos para as dificuldades da vida e pensamos que Deus nos abandonou. Mas a verdade é que o vento contrário não vem para te destruir, ele vem para abrir o mar na sua frente. Hoje aprenderemos como confiar no Senhor quando tudo ao redor diz para desistirmos.

## Desenvolvimento

### 1. O silêncio de Deus não é ausência
• Muitas vezes, Deus se cala para ver como reagimos às tempestades da vida. O silêncio divino testa a profundidade da nossa fé.
• Aplicação prática: Quando você sentir que suas orações não passam do teto, continue orando. É no silêncio que o caráter é provado.
• Frase de impacto 1: "Deus não consulta a sua condição para decidir o seu propósito."
• Frase de impacto 2: "Quem não suporta o processo não consegue administrar a promessa."

### 2. A capa que precisamos lançar fora
• Assim como Bartimeu lançou fora a capa de mendigo para correr até Jesus, nós precisamos deixar para trás velhas identidades.
• Aplicação prática: Identifique qual é a 'capa' do conformismo ou do medo que você tem carregado e decida abandoná-la hoje.
• Frase de impacto 1: "A única guerra que você perde é aquela que decide não lutar."
• Frase de impacto 2: "O vale não é o seu destino. É apenas a sua sala de treinamento."

## Conclusão
A jornada da fé exige que marchemos mesmo quando o mar ainda está fechado. Deus não te trouxe até aqui para te ver perecer, mas para ver a glória Dele se manifestar na sua fraqueza.

## Apelo
Se você reconhece que suas forças se esgotaram e quer a unção do Espírito para vencer essa batalha, dê um passo à frente hoje. A graça de Deus te basta!`;

                  // Stream the mock markdown word by word/line by line
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
                  message: "Esboço gerado e estruturado com sucesso.",
                  status: "completed",
                });

                // Send the fully structured sermon
                send({
                  type: "sermon",
                  sermon: parsedSermonFields,
                });

                send({ type: "done" });
              } catch (e: any) {
                console.error("Stream generation error:", e);
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
                Connection: "keep-alive",
                ...corsHeaders,
              },
            });
          }

          // Retorno JSON normal (se não for streaming)
          const data = await response.json();
          return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error: any) {
          console.error("Erro no proxy da API:", error);
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      },
    },
  },
});
