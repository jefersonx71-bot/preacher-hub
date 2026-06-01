import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

function format(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function PulpitTimer({ className }: { className?: string }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur",
        className,
      )}
    >
      <span className="font-display text-lg tabular-nums tracking-tight text-foreground">
        {format(seconds)}
      </span>
      <button
        type="button"
        onClick={() => setRunning((r) => !r)}
        aria-label={running ? "Pausar cronômetro" : "Iniciar cronômetro"}
        className="flex size-7 items-center justify-center rounded-full bg-gold text-gold-foreground transition-transform active:scale-95"
      >
        {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <button
        type="button"
        onClick={() => {
          setRunning(false);
          setSeconds(0);
        }}
        aria-label="Reiniciar cronômetro"
        className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <RotateCcw className="size-3.5" />
      </button>
    </div>
  );
}
