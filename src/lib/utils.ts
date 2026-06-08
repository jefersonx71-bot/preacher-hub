import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseBibleReference(ref: string): { book: string; chapter: number } | null {
  // Regex para capturar livro (que pode começar com número, ex: 1 Coríntios) e o capítulo subsequente
  const match = ref.trim().match(/^([1-3]?\s*[a-zA-ZáàâãéèêíïóôõöúçÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ\s]+)\s+(\d+)/);
  if (match) {
    return {
      book: match[1].trim(),
      chapter: parseInt(match[2], 10),
    };
  }
  return null;
}
