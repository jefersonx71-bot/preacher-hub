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
  connections?: string[];
}

const SYSTEM_PROMPT = `Você é um dicionário bíblico e assistente de estudo para pregadores. Recebe uma palavra, nome ou termo (ex: "Abisai", "graça", "Hebrom") e produz um mini estudo claro e direto, útil para quando o pregador "der um branco" no púlpito.

Para o termo fornecido, retorne usando a ferramenta save_entry:
- term: o termo já com a grafia/capitalização correta (ex: "Abisai").
- meaning: o significado do nome ou uma definição curta do termo (1 frase). Se for nome próprio, inclua a etimologia/significado do nome quando conhecido.
- summary: 2 a 4 frases explicando quem é a pessoa ou o que é o conceito, com o contexto bíblico essencial.
- references: 1 a 5 referências bíblicas principais relacionadas (ex: "2 Samuel 23:18"). Apenas as referências, sem o texto.
- study: 3 a 5 frases de mini estudo devocional/homilético, destacando uma lição prática e aplicável que o pregador pode usar imediatamente.
- connections: 2 a 4 conexões ou paralelos de outras histórias ou conceitos bíblicos que compartilham o mesmo peso espiritual ou lição teológica (ex: para tribulação: mar vermelho, deserto, Golias como cenários onde Deus testa/forja Seus filhos).

Responda SEMPRE em português do Brasil. Se o termo não for claramente bíblico, dê a melhor explicação possível dentro de uma perspectiva cristã. Seja preciso e fiel ao texto bíblico.`;

export const lookupTerm = createServerFn({ method: "POST" })
  .inputValidator(inputSchema)
  .handler(async ({ data }): Promise<DictionaryEntry> => {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const lovableApiKey = process.env.LOVABLE_API_KEY;
    const apiKey = geminiApiKey || lovableApiKey;
    if (!apiKey) {
      console.warn("Nenhuma chave de API (GEMINI_API_KEY ou LOVABLE_API_KEY) configurada. Usando dados de preview simulados.");
      return new Promise((resolve) => {
        setTimeout(() => {
          // Remove acentuação e padroniza para lowercase
          const clean = data.term.toLowerCase().trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

          const dict: Record<string, DictionaryEntry> = {
            sucote: {
              term: "Sucote",
              meaning: "Significado: 'Cabanas', 'Tendas' ou 'Choupanas' (do hebraico Sukkot).",
              summary: "Localidade geográfica onde o povo de Israel fez sua primeira parada após sair da escravidão do Egito (Êxodo 12:37). É também o nome da grande festa bíblica (Festa dos Tabernáculos), onde a nação habitava em cabanas temporárias para celebrar a colheita e lembrar o cuidado divino.",
              references: ["Êxodo 12:37", "Levítico 23:42-43", "Gênesis 33:17", "Salmo 60:6"],
              study: "Peso Espiritual: Sucote representa o início do caminho da libertação e a dependência total da provisão do Senhor no deserto. Lembra ao pregador e à igreja que nossa habitação terrena é temporária, mas a proteção de Deus sobre as nossas vidas é permanente, provendo abrigo e descanso sob a Sua soberania.",
              connections: [
                "O Deserto de Refinamento (O lugar temporário de habitação sob o cuidado diário de Deus)",
                "O Maná Diário (A provisão milagrosa e diária que exige confiança contínua)",
                "A Festa das Cabanas / Tabernáculos (Celebração da fidelidade histórica de Deus no deserto)"
              ]
            },
            abisai: {
              term: "Abisai",
              meaning: "Significado: 'Meu pai é uma dádiva' ou 'Pai do presente' (do hebraico).",
              summary: "Sobrinho de Davi e filho de Zeruia, irmão de Joabe. Foi um dos generais mais leais, corajosos e impulsivos de Davi, distinguindo-se como um de seus três principais guerreiros no combate contra gigantes e exércitos inimigos.",
              references: ["2 Samuel 23:18", "1 Samuel 26:6-9", "2 Samuel 21:17", "2 Samuel 19:21"],
              study: "Peso Espiritual: Abisai representa a fidelidade incondicional combinada com o perigo do impulso carnal. Embora tenha salvado Davi em combate, ele frequentemente desejava matar os adversários (como Saul e Simei) à força física, ilustrando que nossa dedicação aos líderes e à obra de Deus deve ser submetida à misericórdia e à vontade divina.",
              connections: [
                "Pedro cortando a orelha de Malco (Zelo carnal e violento para proteger um líder espiritual)",
                "Joabe (Fidelidade militar impiedosa focada em conquistas e vinganças)",
                "Saul em sua autossuficiência (Impulsividade que substitui o conselho espiritual pelo ataque imediato)"
              ]
            },
            davi: {
              term: "Davi",
              meaning: "Significado: 'Amado' ou 'Querido' (do hebraico).",
              summary: "O segundo rei de Israel, ungido por Samuel quando era pastor de ovelhas. Homem segundo o coração de Deus, compositor da maioria dos Salmos e herói da fé que derrotou Golias. Foi da linhagem de Davi que nasceu Jesus Cristo.",
              references: ["1 Samuel 16:13", "Salmo 23:1", "Atos 13:22", "2 Samuel 7:12-16"],
              study: "Peso Espiritual: Davi nos ensina sobre a força do arrependimento genuíno. Seu peso espiritual reside no fato de que 'ser segundo o coração de Deus' não significa não pecar, mas sim ter um coração maleável, sensível à correção do Espírito Santo e pronto para confessar e abandonar o pecado.",
              connections: [
                "José no Egito (Ungido por Deus e forjado pela traição, abandono e fidelidade no anonimato)",
                "Daniel na cova dos leões (Fidelidade inabalável que exibe a soberania divina)",
                "Elias no ribeiro de Querite (Sustentado sobrenaturalmente por Deus em dias de isolamento)"
              ]
            },
            moises: {
              term: "Moisés",
              meaning: "Significado: 'Tirado das águas' (do hebraico/egípcio).",
              summary: "O grande libertador, legislador e profeta de Israel. Foi escolhido por Deus para guiar o povo para fora da escravidão do Egito, recebeu as Tábuas da Lei no Monte Sinai e conduziu o povo pelo deserto por 40 anos.",
              references: ["Êxodo 2:10", "Êxodo 3:2-4", "Deuteronômio 34:10", "Hebreus 11:24-27"],
              study: "Peso Espiritual: Moisés exemplifica a intimidade espiritual e a mansidão. Falando com o Senhor face a face, ele nos ensina que o poder de liderança espiritual vem da presença diária no monte de Deus, e que o caráter do líder é forjado no deserto.",
              connections: [
                "O Deserto de Midiã (40 anos de preparação silenciosa no anonimato cuidando de rebanhos)",
                "A Sarça Ardente (O chamado sobrenatural e a revelação do Nome Santo de Deus no trabalho diário)",
                "A Travessia do Mar (Liderança de fé contra a lógica militar humana que avança sob a ordem divina)"
              ]
            },
            graca: {
              term: "Graça",
              meaning: "Significado: 'Favor imerecido' (do grego Charis / hebraico Chen).",
              summary: "A atitude benevolente de Deus de conceder perdão, salvação e reconciliação espiritual à humanidade sem que haja qualquer merecimento próprio. Revela-se perfeitamente na cruz de Jesus Cristo.",
              references: ["Efésios 2:8-9", "Romanos 5:20", "2 Coríntios 12:9", "Tito 2:11"],
              study: "Peso Espiritual: A graça liberta o homem do peso do legalismo e da condenação. Ela nos ensina que somos amados pelo que Cristo realizou na cruz e que a graça não é apenas o perdão inicial, mas o poder diário que nos capacita a viver em santidade.",
              connections: [
                "A parábola do Filho Pródigo (O abraço restaurador do Pai que anula a culpa e devolve a dignidade)",
                "O Publicano na oração (A justificação imerecida recebida pela confissão sincera de dependência)",
                "O espinho na carne de Paulo (A graça manifestada no limite humano: 'O meu poder se aperfeiçoa na fraqueza')"
              ]
            },
            fe: {
              term: "Fé",
              meaning: "Significado: 'Certeza, convicção' (do grego Pistis / hebraico Emunah).",
              summary: "A confiança plena no caráter, na Palavra e nas promessas de Deus, mesmo quando as circunstâncias externas e físicas parecem contrárias. É o meio pelo qual tomamos posse da salvação.",
              references: ["Hebreus 11:1", "Romanos 10:17", "Gálatas 2:20", "Efésios 6:16"],
              study: "Peso Espiritual: O peso da fé está na nossa tomada de ação sob a Palavra de Deus. Ela nos move a marchar em obediência mesmo diante do mar fechado, transformando a esperança invisível em substância real na nossa vida cotidiana.",
              connections: [
                "Abraão deixando Ur (Obediência radical que sai em direção ao desconhecido sob a promessa da herança)",
                "Pedro andando sobre as águas (Fé focada na pessoa de Cristo que supera as leis físicas naturais)",
                "As muralhas de Jericó (A vitória espiritual alcançada unicamente pelo som das trombetas e fé na ordem divina)"
              ]
            },
            hebrom: {
              term: "Hebrom",
              meaning: "Significado: 'Comunhão', 'Aliança' ou 'Associação' (do hebraico).",
              summary: "Uma das cidades mais antigas da Bíblia. Lugar onde Abraão ergueu altares e onde os patriarcas foram enterrados na caverna de Macpela. Serviu como a primeira capital do rei Davi por sete anos e meio.",
              references: ["Gênesis 13:18", "2 Samuel 2:1-4", "Josué 14:13-14", "Gênesis 23:19"],
              study: "Peso Espiritual: Hebrom simboliza a consolidação das alianças divinas e o amadurecimento espiritual. É o lugar onde a fidelidade acumulada do passado encontra a coroação e o início de um novo governo estabelecido por Deus.",
              connections: [
                "Aliança de Abraão (O local onde altares de adoração foram firmados na terra da promessa)",
                "Herança de Calebe (A conquista da cidade das montanhas conquistada pela fé perseverante de um ancião fiel)",
                "A primeira unção de Davi (O início do reinado de Judá sobre a capital das alianças históricas)"
              ]
            },
            elias: {
              term: "Elias",
              meaning: "Significado: 'O Senhor é o meu Deus' (do hebraico).",
              summary: "Profeta corajoso do Antigo Testamento que confrontou o rei Acabe e a idolatria de Baal em Israel. Orou para parar a chuva, desafiou os profetas no Monte Carmelo e foi levado aos céus em um redemoinho com uma carruagem de fogo.",
              references: ["1 Reis 18:21", "1 Reis 19:11-12", "Tiago 5:17-18", "2 Reis 2:11"],
              study: "Peso Espiritual: Elias nos mostra que até mesmo os maiores homens de fé enfrentam dias de desânimo na caverna. O seu peso espiritual nos ensina que o sussurro manso e suave de Deus é o que restaura a nossa alma e nos envia de volta ao ministério.",
              connections: [
                "Davi em Ziclague (O dia de choro extremo restaurado pela busca da presença do Senhor em oração)",
                "Jó em suas cinzas (A restauração de Deus que se manifesta após o silêncio e o quebrantamento)",
                "Moisés no Sinai (O encontro face a face com a glória de Deus na fenda da rocha)"
              ]
            },
            pedro: {
              term: "Pedro",
              meaning: "Significado: 'Pedra' ou 'Pedregulho' (do grego Petros, tradução do aramaico Cefas).",
              summary: "Um dos principais apóstolos de Jesus Cristo, líder da igreja primitiva em Jerusalém e autor de duas epístolas. Anteriormente um pescador chamado Simão, foi transformado por Cristo em um pilar da fé cristã.",
              references: ["Mateus 16:18", "João 21:15-17", "Atos 2:14", "1 Pedro 1:1"],
              study: "Peso Espiritual: Pedro ilustra a jornada de restauração de caráter. Apesar de seu temperamento impulsivo e de ter negado a Jesus, a graça o restaurou para ser o pregador do Pentecostes, mostrando que nossas falhas não determinam o nosso destino quando estamos sob o amor redentor de Cristo.",
              connections: [
                "Abisai (O perigo do zelo impulsivo e do uso da força física para defender líderes)",
                "Fé (Pedro andando sobre as águas e aprendendo a manter os olhos firmos no Senhor)",
                "Lutas e Provações (O choro amargo da negação como o início do quebrantamento para o refinamento de caráter)"
              ]
            },
            paulo: {
              term: "Paulo",
              meaning: "Significado: 'Pequeno' ou 'Humilde' (do latim Paulus). Anteriormente Saulo ('Desejado').",
              summary: "O grande apóstolo dos gentios, autor de treze epístolas do Novo Testamento. Converteu-se no caminho de Damasco após perseguir ativamente a igreja primitiva, tornando-se o maior missionário da história do cristianismo.",
              references: ["Atos 9:3-6", "Romanos 1:1", "Gálatas 2:20", "2 Timóteo 4:7-8"],
              study: "Peso Espiritual: Paulo nos ensina a centralidade da cruz e a dependência da força divina na nossa fraqueza. Seu 'espinho na carne' exemplifica que as maiores tribulações e limitações humanas cooperam para que o poder e a glória de Deus se manifestem perfeitamente.",
              connections: [
                "Graça (O favor imerecido que resgata o perseguidor e o transforma em pregador)",
                "Elias (Enfrentando oposição severa de governantes e perseguição pela Palavra)",
                "Lutas e Provações (Múltiplos açoites, prisões e naufrágios como forjas de paciência e perseverança)"
              ]
            },
            lutas: {
              term: "Lutas e Provações",
              meaning: "Significado: 'Lutas, tribulações e aflições temporárias' (do grego Thlipsis / hebraico Tsar).",
              summary: "O processo de provações e aflições pelas quais passamos. No contexto bíblico geral, as lutas não indicam o abandono de Deus, mas constituem a Sua oficina soberana para lapidar o nosso caráter e purificar a nossa confiança.",
              references: ["Tiago 1:2-4", "João 16:33", "Romanos 5:3-4", "1 Pedro 1:6-7"],
              study: "Peso Espiritual: O peso espiritual das lutas e tribulações é nos ensinar que o sofrimento produz perseverança, paciência e caráter aprovado. Ao sermos espremidos pela aflição, o orgulho é quebrado e o poder de Deus é aperfeiçoado em nós.",
              connections: [
                "O Mar Vermelho (A barreira de perigo que serve para nos encurralar, mas é o palco onde Deus abre caminhos de salvação)",
                "Golias e os Gigantes (O gigante assustador que se levanta para paralisar o povo, mas serve para promover e testar a fé do jovem ungido Davi)",
                "O Deserto (Lugar de isolamento, calor e escassez onde Deus nos limpa e treina a dependência de Sua voz)",
                "A Cova dos Leões (A tribulação extrema e injusta que resulta na manifestação pública do poder de Deus sobre as nações)"
              ]
            },
            tribulacao: {
              term: "Lutas e Provações",
              meaning: "Significado: 'Lutas, tribulações e aflições temporárias' (do grego Thlipsis / hebraico Tsar).",
              summary: "O processo de provações e aflições pelas quais passamos. No contexto bíblico geral, as lutas não indicam o abandono de Deus, mas constituem a Sua oficina soberana para lapidar o nosso caráter e purificar a nossa confiança.",
              references: ["Tiago 1:2-4", "João 16:33", "Romanos 5:3-4", "1 Pedro 1:6-7"],
              study: "Peso Espiritual: O peso espiritual das lutas e tribulações é nos ensinar que o sofrimento produz perseverança, paciência e caráter aprovado. Ao sermos espremidos pela aflição, o orgulho é quebrado e o poder de Deus é aperfeiçoado em nós.",
              connections: [
                "O Mar Vermelho (A barreira de perigo que serve para nos encurralar, mas é o palco onde Deus abre caminhos de salvação)",
                "Golias e os Gigantes (O gigante assustador que se levanta para paralisar o povo, mas serve para promover e testar a fé do jovem ungido Davi)",
                "O Deserto (Lugar de isolamento, calor e escassez onde Deus nos limpa e treina a dependência de Sua voz)",
                "A Cova dos Leões (A tribulação extrema e injusta que resulta na manifestação pública do poder de Deus sobre as nações)"
              ]
            },
            "mar vermelho": {
              term: "Mar Vermelho",
              meaning: "Significado: 'Mar de Juncos' (do hebraico Yam Suph).",
              summary: "O local histórico da libertação física de Israel da escravidão egípcia. Diante do exército de Faraó e do mar intransponível, Deus ordenou que o povo marchasse e abriu as águas por meio de Moisés, permitindo a travessia a pé enxuto (Êxodo 14).",
              references: ["Êxodo 14:21-22", "Salmo 106:9", "Hebreus 11:29", "1 Coríntios 10:1-2"],
              study: "Peso Espiritual: O Mar Vermelho representa a tribulação que parece nos encurralar sem saída. Para nós é um desespero, mas para Deus é o cenário perfeito para aperfeiçoar o nosso caráter e demonstrar que a salvação vem unicamente do Senhor. A instrução é: 'Não temais; aquietai-vos e vede o livramento'.",
              connections: [
                "Lutas e Provações (O processo pedagógico de Deus de nos colocar em situações extremas para nos lapidar)",
                "Golias e os Gigantes (Oposição intimidadora e intransponível que Deus usa para promover a fé e manifestar Sua glória)",
                "O Deserto (A jornada de refinamento após a travessia do mar, onde a dependência diária do maná molda o caráter)",
                "A Cova dos Leões (A situação sem saída física onde Deus envia livramento sobrenatural e fecha bocas de feras)"
              ]
            },
            marvermelho: {
              term: "Mar Vermelho",
              meaning: "Significado: 'Mar de Juncos' (do hebraico Yam Suph).",
              summary: "O local histórico da libertação física de Israel da escravidão egípcia. Diante do exército de Faraó e do mar intransponível, Deus ordenou que o povo marchasse e abriu as águas por meio de Moisés, permitindo a travessia a pé enxuto (Êxodo 14).",
              references: ["Êxodo 14:21-22", "Salmo 106:9", "Hebreus 11:29", "1 Coríntios 10:1-2"],
              study: "Peso Espiritual: O Mar Vermelho representa a tribulação que parece nos encurralar sem saída. Para nós é um desespero, mas para Deus é o cenário perfeito para aperfeiçoar o nosso caráter e demonstrar que a salvação vem unicamente do Senhor. A instrução é: 'Não temais; aquietai-vos e vede o livramento'.",
              connections: [
                "Lutas e Provações (O processo pedagógico de Deus de nos colocar em situações extremas para nos lapidar)",
                "Golias e os Gigantes (Oposição intimidadora e intransponível que Deus usa para promover a fé e manifestar Sua glória)",
                "O Deserto (A jornada de refinamento após a travessia do mar, onde a dependência diária do maná molda o caráter)",
                "A Cova dos Leões (A situação sem saída física onde Deus envia livramento sobrenatural e fecha bocas de feras)"
              ]
            },
            golias: {
              term: "Golias e os Gigantes",
              meaning: "Significado: 'Exilado', 'Passagem' ou 'Aquele que brilha' (do filisteu/hebraico).",
              summary: "O guerreiro gigante da cidade filisteia de Gate que desafiou o exército de Israel por 40 dias. Foi derrotado pelo jovem pastor Davi usando apenas uma funda e uma pedra, demonstrando que a batalha pertence ao Senhor (1 Samuel 17).",
              references: ["1 Samuel 17:4", "1 Samuel 17:45-47", "2 Samuel 21:19", "1 Crônicas 20:5"],
              study: "Peso Espiritual: Golias representa as tribulações gigantescas e intimidadoras que vêm para paralisar a nossa caminhada com medo. No entanto, o gigante é o instrumento de Deus para tirar o Seu servo do anonimato e forjar um caráter de autoridade espiritual e confiança absoluta.",
              connections: [
                "Lutas e Provações (Cenários de tribulação que provam nossa confiança e destemor contra os inimigos)",
                "O Mar Vermelho (Um obstáculo gigante e impossível aos olhos humanos que Deus abre para demonstrar Sua soberania)",
                "O Deserto (Lugar onde enfrentamos gigantes interiores como a solidão, a escassez e a tentação de desistir)",
                "A Cova dos Leões (Onde o servo fiel encara de frente ameaças mortais sem recuar de sua comunhão)"
              ]
            },
            gigantes: {
              term: "Golias e os Gigantes",
              meaning: "Significado: 'Exilado', 'Passagem' ou 'Aquele que brilha' (do filisteu/hebraico).",
              summary: "O guerreiro gigante da cidade filisteia de Gate que desafiou o exército de Israel por 40 dias. Foi derrotado pelo jovem pastor Davi usando apenas uma funda e uma pedra, demonstrando que a batalha pertence ao Senhor (1 Samuel 17).",
              references: ["1 Samuel 17:4", "1 Samuel 17:45-47", "2 Samuel 21:19", "1 Crônicas 20:5"],
              study: "Peso Espiritual: Golias representa as tribulações gigantescas e intimidadoras que vêm para paralisar a nossa caminhada com medo. No entanto, o gigante é o instrumento de Deus para tirar o Seu servo do anonimato e forjar um caráter de autoridade espiritual e confiança absoluta.",
              connections: [
                "Lutas e Provações (Cenários de tribulação que provam nossa confiança e destemor contra os inimigos)",
                "O Mar Vermelho (Um obstáculo gigante e impossível aos olhos humanos que Deus abre para demonstrar Sua soberania)",
                "O Deserto (Lugar onde enfrentamos gigantes interiores como a solidão, a escassez e a tentação de desistir)",
                "A Cova dos Leões (Onde o servo fiel encara de frente ameaças mortais sem recuar de sua comunhão)"
              ]
            },
            deserto: {
              term: "O Deserto",
              meaning: "Significado: Lugar de fala, isolamento ou pasto (do hebraico Midbar).",
              summary: "O cenário geográfico e espiritual onde o povo de Israel peregrinou por 40 anos para ser testado e instruído na Lei de Deus. Foi também o local onde Jesus jejuou por 40 dias e foi tentado, vencendo o diabo com a Palavra.",
              references: ["Deuteronômio 8:2-3", "Mateus 4:1", "Oséias 2:14", "Lucas 1:80"],
              study: "Peso Espiritual: O deserto não é um lugar de abandono, mas a escola do Espírito. É na escassez de recursos humanos e no silêncio que Deus limpa o nosso caráter, ensina a dependência diária da Sua provisão (o maná) e fala diretamente ao nosso coração para nos preparar para a promessa.",
              connections: [
                "Lutas e Provações (Aflições e privações pedagógicas de Deus para purificar a nossa fé)",
                "O Mar Vermelho (A travessia dramática que nos introduz no deserto, mostrando o poder que nos liberta)",
                "Golias e os Gigantes (Onde o caráter forjado no anonimato do deserto é testado publicamente contra as maiores lutas)",
                "A Cova dos Leões (Onde a disciplina e intimidade forjadas no deserto protegem o servo no dia do perigo)"
              ]
            },
            "cova dos leoes": {
              term: "A Cova dos Leões",
              meaning: "Significado: Lugar de teste extremo de fidelidade e integridade.",
              summary: "O local de execução para onde o profeta Daniel foi lançado injustamente por manter seu hábito diário de oração ao Deus de Israel, desobedecendo ao decreto real. Deus enviou o Seu anjo e fechou a boca dos leões (Daniel 6).",
              references: ["Daniel 6:16", "Daniel 6:22", "Hebreus 11:33", "1 Pedro 5:8"],
              study: "Peso Espiritual: A cova dos leões nos ensina sobre a fidelidade inabalável sob perseguição. A tribulação extrema de ser lançado às feras é o palco onde Deus demonstra que a nossa integridade no secreto nos preserva no meio do perigo, aperfeiçoando a nossa perseverança.",
              connections: [
                "Lutas e Provações (Onde as maiores aflições testam o limite da nossa lealdade e revelam o livramento divino)",
                "Golias e os Gigantes (Onde a fé inabalável enfrenta a ameaça de morte iminente e glorifica a Deus)",
                "O Mar Vermelho (A situação sem saída física onde Deus intervém de maneira sobrenatural)",
                "O Deserto (Lugar de disciplina espiritual diária que prepara o servo para permanecer firme sob provações)"
              ]
            },
            cova: {
              term: "A Cova dos Leões",
              meaning: "Significado: Lugar de teste extremo de fidelidade e integridade.",
              summary: "O local de execução para onde o profeta Daniel foi lançado injustamente por manter seu hábito diário de oração ao Deus de Israel, desobedecendo ao decreto real. Deus enviou o Seu anjo e fechou a boca dos leões (Daniel 6).",
              references: ["Daniel 6:16", "Daniel 6:22", "Hebreus 11:33", "1 Pedro 5:8"],
              study: "Peso Espiritual: A cova dos leões nos ensina sobre a fidelidade inabalável sob perseguição. A tribulação extrema de ser lançado às feras é o palco onde Deus demonstra que a nossa integridade no secreto nos preserva no meio do perigo, aperfeiçoando a nossa perseverança.",
              connections: [
                "Lutas e Provações (Onde as maiores aflições testam o limite da nossa lealdade e revelam o livramento divino)",
                "Golias e os Gigantes (Onde a fé inabalável enfrenta a ameaça de morte iminente e glorifica a Deus)",
                "O Mar Vermelho (A situação sem saída física onde Deus intervém de maneira sobrenatural)",
                "O Deserto (Lugar de disciplina espiritual diária que prepara o servo para permanecer firme sob provações)"
              ]
            }
          };

          const entry = dict[clean];
          if (entry) {
            resolve(entry);
            return;
          }

          resolve({
            term: data.term.charAt(0).toUpperCase() + data.term.slice(1).toLowerCase(),
            meaning: `Significado/Etimologia: Para ver a etimologia e significado exatos de "${data.term}", ative a chave de IA. (Sugestões mockadas completas: Pedro, Paulo, Moisés, Davi, Abisai, Elias, Graça, Fé, Hebrom, Lutas, Mar Vermelho, Golias, Deserto, Cova dos Leões).`,
            summary: `O termo "${data.term}" desempenha um papel importante nas escrituras sagradas. No Antigo e Novo Testamento, conceitos e termos como este servem para nos revelar aspectos da santidade de Deus, do comportamento esperado do Seu povo e da revelação profética da redenção em Jesus Cristo.`,
            references: [
              "Salmo 119:105",
              "João 1:1",
              "2 Timóteo 3:16"
            ],
            study: `Peso Espiritual: Use o termo "${data.term}" no seu sermão para ilustrar a soberania divina e chamar a igreja a uma decisão prática de obediência. Lembre a congregação de que a Palavra de Deus se aplica a cada detalhe das nossas vidas, nos desafiando a abandonar a autossuficiência e a depender totalmente da graça e da direção do Espírito Santo.`,
            connections: [
              "O Deserto (O cenário clássico bíblico onde Deus conduz Seus filhos para falar ao coração e moldar o caráter)",
              "A Provação de Abraão (O teste de obediência no topo do monte que resulta na revelação da provisão divina)",
              "O Ribeiro de Querite (Lugar de isolamento e escassez física onde Deus nos treina a viver sob dependência sobrenatural)"
            ]
          });
        }, 1200);
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
                  connections: {
                    type: "array",
                    items: { type: "string" },
                    description: "2 a 4 conexões ou paralelos de outras histórias bíblicas que compartilham o mesmo peso espiritual"
                  }
                },
                required: ["term", "meaning", "summary", "references", "study", "connections"],
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
    if (response.status === 402 && !isGeminiStudio) {
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
      connections: Array.isArray(parsed.connections) ? parsed.connections.filter(Boolean) : [],
    };
  });
