export interface BibleBook {
  /** Portuguese display name */
  name: string;
  /** English name used by the bible-api.com query */
  query: string;
  /** Number of chapters */
  chapters: number;
  /** "AT" (Antigo Testamento) or "NT" (Novo Testamento) */
  testament: "AT" | "NT";
}

export const BIBLE_BOOKS: BibleBook[] = [
  { name: "Gênesis", query: "Genesis", chapters: 50, testament: "AT" },
  { name: "Êxodo", query: "Exodus", chapters: 40, testament: "AT" },
  { name: "Levítico", query: "Leviticus", chapters: 27, testament: "AT" },
  { name: "Números", query: "Numbers", chapters: 36, testament: "AT" },
  { name: "Deuteronômio", query: "Deuteronomy", chapters: 34, testament: "AT" },
  { name: "Josué", query: "Joshua", chapters: 24, testament: "AT" },
  { name: "Juízes", query: "Judges", chapters: 21, testament: "AT" },
  { name: "Rute", query: "Ruth", chapters: 4, testament: "AT" },
  { name: "1 Samuel", query: "1 Samuel", chapters: 31, testament: "AT" },
  { name: "2 Samuel", query: "2 Samuel", chapters: 24, testament: "AT" },
  { name: "1 Reis", query: "1 Kings", chapters: 22, testament: "AT" },
  { name: "2 Reis", query: "2 Kings", chapters: 25, testament: "AT" },
  { name: "1 Crônicas", query: "1 Chronicles", chapters: 29, testament: "AT" },
  { name: "2 Crônicas", query: "2 Chronicles", chapters: 36, testament: "AT" },
  { name: "Esdras", query: "Ezra", chapters: 10, testament: "AT" },
  { name: "Neemias", query: "Nehemiah", chapters: 13, testament: "AT" },
  { name: "Ester", query: "Esther", chapters: 10, testament: "AT" },
  { name: "Jó", query: "Job", chapters: 42, testament: "AT" },
  { name: "Salmos", query: "Psalms", chapters: 150, testament: "AT" },
  { name: "Provérbios", query: "Proverbs", chapters: 31, testament: "AT" },
  { name: "Eclesiastes", query: "Ecclesiastes", chapters: 12, testament: "AT" },
  { name: "Cânticos", query: "Song of Solomon", chapters: 8, testament: "AT" },
  { name: "Isaías", query: "Isaiah", chapters: 66, testament: "AT" },
  { name: "Jeremias", query: "Jeremiah", chapters: 52, testament: "AT" },
  { name: "Lamentações", query: "Lamentations", chapters: 5, testament: "AT" },
  { name: "Ezequiel", query: "Ezekiel", chapters: 48, testament: "AT" },
  { name: "Daniel", query: "Daniel", chapters: 12, testament: "AT" },
  { name: "Oseias", query: "Hosea", chapters: 14, testament: "AT" },
  { name: "Joel", query: "Joel", chapters: 3, testament: "AT" },
  { name: "Amós", query: "Amos", chapters: 9, testament: "AT" },
  { name: "Obadias", query: "Obadiah", chapters: 1, testament: "AT" },
  { name: "Jonas", query: "Jonah", chapters: 4, testament: "AT" },
  { name: "Miqueias", query: "Micah", chapters: 7, testament: "AT" },
  { name: "Naum", query: "Nahum", chapters: 3, testament: "AT" },
  { name: "Habacuque", query: "Habakkuk", chapters: 3, testament: "AT" },
  { name: "Sofonias", query: "Zephaniah", chapters: 3, testament: "AT" },
  { name: "Ageu", query: "Haggai", chapters: 2, testament: "AT" },
  { name: "Zacarias", query: "Zechariah", chapters: 14, testament: "AT" },
  { name: "Malaquias", query: "Malachi", chapters: 4, testament: "AT" },
  { name: "Mateus", query: "Matthew", chapters: 28, testament: "NT" },
  { name: "Marcos", query: "Mark", chapters: 16, testament: "NT" },
  { name: "Lucas", query: "Luke", chapters: 24, testament: "NT" },
  { name: "João", query: "John", chapters: 21, testament: "NT" },
  { name: "Atos", query: "Acts", chapters: 28, testament: "NT" },
  { name: "Romanos", query: "Romans", chapters: 16, testament: "NT" },
  { name: "1 Coríntios", query: "1 Corinthians", chapters: 16, testament: "NT" },
  { name: "2 Coríntios", query: "2 Corinthians", chapters: 13, testament: "NT" },
  { name: "Gálatas", query: "Galatians", chapters: 6, testament: "NT" },
  { name: "Efésios", query: "Ephesians", chapters: 6, testament: "NT" },
  { name: "Filipenses", query: "Philippians", chapters: 4, testament: "NT" },
  { name: "Colossenses", query: "Colossians", chapters: 4, testament: "NT" },
  { name: "1 Tessalonicenses", query: "1 Thessalonians", chapters: 5, testament: "NT" },
  { name: "2 Tessalonicenses", query: "2 Thessalonians", chapters: 3, testament: "NT" },
  { name: "1 Timóteo", query: "1 Timothy", chapters: 6, testament: "NT" },
  { name: "2 Timóteo", query: "2 Timothy", chapters: 4, testament: "NT" },
  { name: "Tito", query: "Titus", chapters: 3, testament: "NT" },
  { name: "Filemom", query: "Philemon", chapters: 1, testament: "NT" },
  { name: "Hebreus", query: "Hebrews", chapters: 13, testament: "NT" },
  { name: "Tiago", query: "James", chapters: 5, testament: "NT" },
  { name: "1 Pedro", query: "1 Peter", chapters: 5, testament: "NT" },
  { name: "2 Pedro", query: "2 Peter", chapters: 3, testament: "NT" },
  { name: "1 João", query: "1 John", chapters: 5, testament: "NT" },
  { name: "2 João", query: "2 John", chapters: 1, testament: "NT" },
  { name: "3 João", query: "3 John", chapters: 1, testament: "NT" },
  { name: "Judas", query: "Jude", chapters: 1, testament: "NT" },
  { name: "Apocalipse", query: "Revelation", chapters: 22, testament: "NT" },
];

export interface BibleVersion {
  id: string;
  /** Short label shown in the column header */
  label: string;
  /** Full name of the translation */
  fullName: string;
}

/**
 * Portuguese Bible versions available for study.
 * To add a new version later, append an entry here whose `id` matches a
 * dataset slug supported by the fetch layer (see bible.functions.ts).
 */
export const BIBLE_VERSIONS: BibleVersion[] = [
  { id: "nvi", label: "NVI", fullName: "Nova Versão Internacional" },
  { id: "acf", label: "ACF", fullName: "Almeida Corrigida Fiel" },
  { id: "aa", label: "AA", fullName: "Almeida Revista e Atualizada" },
  { id: "ntlh", label: "NTLH", fullName: "Nova Tradução na Linguagem de Hoje" },
  { id: "nvt", label: "NVT", fullName: "Nova Versão Transformadora" },
  { id: "naa", label: "NAA", fullName: "Nova Almeida Atualizada" },
  { id: "interlinear", label: "Interlinear", fullName: "Interlinear Grego/Hebraico" }
];

export function versionById(id: string): BibleVersion | undefined {
  return BIBLE_VERSIONS.find((v) => v.id === id);
}
