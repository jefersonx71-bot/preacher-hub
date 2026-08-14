export function getApiUrl(path: string): string {
  // Se estivermos rodando no app nativo (Capacitor)
  if (typeof window !== "undefined" && (window as any).Capacitor?.isNative) {
    return `https://preacher-hub.vercel.app${path}`;
  }

  return path;
}
