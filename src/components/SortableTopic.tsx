import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type { Topic } from "@/lib/sermons";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  topic: Topic;
  index: number;
  onChange: (patch: Partial<Topic>) => void;
  onRemove: () => void;
}

export function SortableTopic({ topic, index, onChange, onRemove }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: topic.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-border bg-card p-3 shadow-soft"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-secondary active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gold/15 font-display text-sm font-semibold text-gold">
          {index + 1}
        </span>
        <Input
          value={topic.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={`Tópico ${index + 1}`}
          aria-label={`Título do tópico ${index + 1}`}
          className="h-9 border-none bg-transparent px-1 font-display text-base font-semibold shadow-none focus-visible:ring-0"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remover tópico"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
      <Textarea
        value={topic.content}
        onChange={(e) => onChange({ content: e.target.value })}
        placeholder="Subtópicos, ilustrações, versículos ou o texto completo..."
        className="mt-2 min-h-24 resize-y bg-secondary/40 text-sm leading-relaxed"
      />
    </div>
  );
}
