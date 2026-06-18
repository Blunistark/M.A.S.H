export function TypingIndicator() {
  return (
    <div className="flex flex-col mb-5 items-start slide-up">
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-1.5 ml-1">
        <div className="w-4 h-4 rounded bg-primary-bg flex items-center justify-center">
          <span className="text-[8px] text-primary font-bold">+</span>
        </div>
        <span className="text-[11px] font-semibold text-primary tracking-wide">HEALTH ASSISTANT</span>
      </div>

      {/* Dots bubble */}
      <div className="bg-bg-secondary border border-border-light rounded-2xl rounded-bl-md px-5 py-4 flex items-center gap-1.5">
        <div className="typing-dot w-2 h-2 bg-text-muted rounded-full" />
        <div className="typing-dot w-2 h-2 bg-text-muted rounded-full" />
        <div className="typing-dot w-2 h-2 bg-text-muted rounded-full" />
      </div>
    </div>
  );
}
