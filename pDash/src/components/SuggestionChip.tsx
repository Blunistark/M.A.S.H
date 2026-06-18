interface SuggestionChipProps {
  emoji: string;
  label: string;
  onClick: () => void;
}

export function SuggestionChip({ emoji, label, onClick }: SuggestionChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 bg-white hover:bg-primary-bg active:scale-[0.97] 
                 rounded-2xl px-4 py-3.5 text-sm font-medium text-text 
                 transition-all duration-200 cursor-pointer border border-border
                 hover:border-primary/30 shadow-sm"
    >
      <span className="text-lg">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}
