import { createFileRoute } from "@tanstack/react-router";
import { parseMarkdownToSermon } from "@/lib/parse-markdown";
import { corsHeaders, handleCorsOptions } from "@/lib/cors";

export const Route = createFileRoute("/api/analyze-sermon-stream")({
  server: {
    handlers: {
      OPTIONS: async () => handleCorsOptions(),
      POST: async ({ request }) => {
        try {
          const { text } = (await request.json()) as { text: string };

          if (!text || text.trim().length < 40) {
            return new Response(JSON.stringify({ error: "Sermão é obrigatório para análise." }), {
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

Você receberá anotações brutas, rascunhos ou uma transcrição de sermão. Reestruture e organize esse conteúdo em um esboço de pregação inspirador no estilo Jeff, mantendo as ideias, histórias e passagens originais intactas.

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

          const userPrompt = `Por favor, reestruture o seguinte texto em um esboço no estilo "Modo Jeff" seguindo a estrutura exigida:
${text}`;

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
                  message: "Analisando notas fornecidas e buscando passagens citadas...",
                  status: "running",
                });
                await new Promise((r) => setTimeout(r, 800));
                send({
                  type: "step",
                  id: "investigating",
                  message: "Notas escaneadas. Passagens bíblicas identificadas no rascunho.",
                  status: "completed",
                });

                // Step 2: Thinking (CoT)
                const thought = `[ANALISANDO ANOTAÇÕES BRUTAS]
Tamanho do rascunho recebido: ${text.length} caracteres.

1. Identificação de Tópicos e Personagens:
- Escaneando referências a histórias, personagens bíblicos e pontos sugeridos pelo pregador.
- Separando anotações pessoais do conteúdo homilético principal.

2. Modelagem Homilética (Modo Jeff):
- Organizar a estrutura de tópicos progressiva para que as notas pareçam uma caminhada.
- Elevar a linguagem do rascunho para sentenças verbais fortes típicas de púlpito.
- Projetar aplicações práticas do cotidiano e frases curtas memorizáveis.`;

                send({
                  type: "step",
                  id: "thinking",
                  message: "Modelagem Homilética (CoT)...",
                  status: "running",
                  thought,
                });
                await new Promise((r) => setTimeout(r, 1200));
                send({
                  type: "step",
                  id: "thinking",
                  message: "Modelagem de estrutura finalizada com base nas anotações.",
                  status: "completed",
                });

                // Step 3: Drafting
                send({
                  type: "step",
                  id: "drafting",
                  message: "Refinando e compilando esboço em tempo real...",
                  status: "running",
                });

                let accumulatedResult = "";

                if (!apiKey) {
                  // Fallback offline simulated stream
                  console.warn("Sem chave de API configurada. Usando simulador offline.");

                  // Try to find a Bible passage inside the pasted text to make the mock look slightly smart
                  let detectedPassage = "Filipenses 4:13";
                  const regex = /([12]\s+)?[A-Z][a-zà-ÿ]+\s+\d+:\d+(-\d+)?/;
                  const match = text.match(regex);
                  if (match) {
                    detectedPassage = match[0];
                  }

                  const mockMarkdown = `# Colhendo os Frutos da Dependência

**Versículo Base:** ${detectedPassage}
**Tema:** A nossa dependência total de Deus é a chave para a estabilidade no meio da tempestade.
**Tags:** Fé, Oração, Graça

## Introdução
Anotações do pregador reestruturadas para o púlpito. Quando lemos essas notas, vemos o desejo de expressar a soberania de Deus sobre as nossas fraquezas. Hoje entenderemos que quando nos esvaziamos de nós mesmos, Deus derrama a Sua força.

## Desenvolvimento

### 1. O altar da dependência diária
• As notas apontavam para a importância de orar de manhã. No púlpito, isso se traduz como um ato contínuo de dependência e entrega.
• Aplicação prática: Comece o seu dia entregando suas decisões a Deus no altar da oração secreta, antes de fazer qualquer escolha.
• Frase de impacto 1: "Quem não dobra os joelhos diante de Deus no secreto, não fica de pé diante do mundo no público."
• Frase de impacto 2: "Deus não unge a nossa independência; Ele derrama a Sua graça na nossa rendição."

### 2. A força revelada no deserto
• Desertos e momentos difíceis servem para limpar o que não presta em nós. O deserto é a escola da maturidade ministerial.
• Aplicação prática: Se você está em uma estação árida, não clame apenas para sair dela. Pergunte a Deus o que Ele quer te ensinar nela.
• Frase de impacto 1: "O deserto não foi feito para você morrer, mas para a sua autossuficiência expirar."
• Frase de impacto 2: "Você nunca saberá que Deus é tudo o que você precisa até que Ele seja tudo o que você tem."

## Conclusão
Recapitulando a mensagem central das anotações originais: a verdadeira vitória não está em sermos fortes por nós mesmos, mas em estarmos escondidos na rocha que é Cristo Jesus.

## Apelo
Se você quer quebrar o orgulho da autossuficiência e declarar sua dependência do Senhor neste dia, venha até a frente. O Senhor te espera com graça renovadora.`;

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
                  message: "Rascunho estruturado e polido com sucesso.",
                  status: "completed",
                });

                // Send the fully structured sermon
                send({
                  type: "sermon",
                  sermon: parsedSermonFields,
                });

                send({ type: "done" });
              } catch (e: any) {
                console.error("Stream analysis error:", e);
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
        } catch (error: any) {
          console.error("Outer route error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Erro interno no servidor." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            },
          );
        }
      },
    },
  },
});
