import { type Sermon, type Topic, uid } from "./sermons";

export function parseMarkdownToSermon(
  markdown: string,
): Omit<Sermon, "id" | "createdAt" | "updatedAt"> {
  const lines = markdown.split("\n");
  let title = "";
  let baseVerse = "";
  let theme = "";
  let tags: string[] = [];
  let introduction = "";
  let conclusion = "";
  let appeal = "";
  const topics: { title: string; content: string }[] = [];

  let currentSection = "";
  let currentTopicTitle = "";
  let currentTopicContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (
      !trimmed &&
      currentSection !== "intro" &&
      currentSection !== "conclusion" &&
      currentSection !== "appeal" &&
      currentSection !== "development"
    ) {
      continue;
    }

    if (trimmed.startsWith("# ")) {
      title = trimmed.substring(2).trim();
      continue;
    }

    if (trimmed.startsWith("**Versículo Base:**")) {
      baseVerse = trimmed.substring("**Versículo Base:**".length).trim();
      continue;
    }

    if (trimmed.startsWith("**Tema:**")) {
      theme = trimmed.substring("**Tema:**".length).trim();
      continue;
    }

    if (trimmed.startsWith("**Tags:**")) {
      const tagsStr = trimmed.substring("**Tags:**".length).trim();
      tags = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      continue;
    }

    if (trimmed.startsWith("## Introdução")) {
      currentSection = "intro";
      continue;
    }

    if (trimmed.startsWith("## Desenvolvimento")) {
      currentSection = "development";
      continue;
    }

    if (trimmed.startsWith("## Conclusão")) {
      // Save last topic if parsing development
      if (currentTopicTitle) {
        topics.push({ title: currentTopicTitle, content: currentTopicContent.join("\n").trim() });
        currentTopicTitle = "";
        currentTopicContent = [];
      }
      currentSection = "conclusion";
      continue;
    }

    if (trimmed.startsWith("## Apelo")) {
      // Save last topic if parsing development
      if (currentTopicTitle) {
        topics.push({ title: currentTopicTitle, content: currentTopicContent.join("\n").trim() });
        currentTopicTitle = "";
        currentTopicContent = [];
      }
      currentSection = "appeal";
      continue;
    }

    if (currentSection === "development" && trimmed.startsWith("### ")) {
      // Save previous topic if exists
      if (currentTopicTitle) {
        topics.push({ title: currentTopicTitle, content: currentTopicContent.join("\n").trim() });
      }
      currentTopicTitle = trimmed.substring(4).trim();
      currentTopicContent = [];
      continue;
    }

    // Accumulate content based on section
    if (currentSection === "intro") {
      introduction += (introduction ? "\n" : "") + line;
    } else if (currentSection === "conclusion") {
      conclusion += (conclusion ? "\n" : "") + line;
    } else if (currentSection === "appeal") {
      appeal += (appeal ? "\n" : "") + line;
    } else if (currentSection === "development" && currentTopicTitle) {
      currentTopicContent.push(line);
    }
  }

  // Save last section or topic if anything left
  if (currentTopicTitle) {
    topics.push({ title: currentTopicTitle, content: currentTopicContent.join("\n").trim() });
  }

  // Fallback default values
  return {
    title: title || "Esboço Gerado por IA",
    baseVerse: baseVerse || "Filipenses 4:13",
    theme: theme || "Mensagem bíblica inspiradora",
    introduction: introduction.trim(),
    conclusion: conclusion.trim(),
    appeal: appeal.trim(),
    tags: tags.length > 0 ? tags : ["Fé"],
    topics:
      topics.length > 0
        ? topics.map((t) => ({
            id: uid(),
            title: t.title,
            content: t.content,
          }))
        : [{ id: uid(), title: "1. Tópico da Mensagem", content: "• Conteúdo do tópico..." }],
  };
}
