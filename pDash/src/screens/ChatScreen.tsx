import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, Send, Paperclip } from 'lucide-react';
import { ChatBubble } from '../components/ChatBubble';
import { TypingIndicator } from '../components/TypingIndicator';
import { useChat } from '../hooks/useChat';
import { useVoiceInput } from '../hooks/useVoiceInput';

export function ChatScreen() {
  const { messages, isLoading, sendMessage } = useChat();
  const { isListening, startListening, stopListening, transcript, speak, setOrbState } =
    useVoiceInput();
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setInputText('');
      setOrbState('processing');

      const response = await sendMessage(text);

      if (response.text) {
        await speak(response.text.replace(/[*#\n]/g, ' ').substring(0, 200));
      }
      setOrbState('idle');
    },
    [sendMessage, speak, setOrbState]
  );

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleSend(transcript.trim());
      }
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening, transcript, handleSend]);

  const handleInputSubmit = useCallback(() => {
    if (inputText.trim()) {
      handleSend(inputText.trim());
    }
  }, [inputText, handleSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleInputSubmit();
      }
    },
    [handleInputSubmit]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-white">
      {/* Header — matching ref style */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center">
            <span className="text-primary font-bold text-sm">+</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-primary">MedPulse Assistant</p>
        <div className="flex items-center gap-2">
          <button className="relative p-2">
            <span className="text-text-secondary">👤</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
      </div>

      {/* Transcript overlay */}
      {isListening && transcript && (
        <div className="mx-4 mb-2 px-4 py-2 bg-primary-bg border border-primary/20 rounded-xl">
          <p className="text-xs text-primary font-medium">🎙️ {transcript}</p>
        </div>
      )}

      {/* Input Bar — matching ref: attach icon, placeholder, send button */}
      <div className="px-4 pb-4 pt-2 border-t border-border-light bg-white">
        <div className="flex items-center gap-2 bg-bg-secondary border border-border rounded-2xl px-3 py-2">
          <button 
            onClick={handleMicToggle}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-primary text-white animate-pulse'
                : 'hover:bg-primary-bg text-text-muted'
            }`}
          >
            {isListening ? <Mic size={18} /> : <Paperclip size={18} />}
          </button>
          <input
            id="chat-text-input"
            type="text"
            placeholder="Ask about your health data..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
          />
          <button
            onClick={handleInputSubmit}
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
