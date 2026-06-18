import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Mic, Send, Plus } from 'lucide-react';
import { VoiceOrb } from '../components/VoiceOrb';
import { SuggestionChip } from '../components/SuggestionChip';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { useChat } from '../hooks/useChat';

const suggestions = [
  { emoji: '📅', label: 'Book Appointment' },
  { emoji: '🔍', label: 'Find My Doctor' },
  { emoji: '🔄', label: 'Reschedule Visit' },
  { emoji: '💊', label: 'Check Prescription' },
];

export function HomeScreen() {
  const navigate = useNavigate();
  const { orbState, isListening, startListening, stopListening, speak, transcript, setOrbState } =
    useVoiceInput();
  const { sendMessage } = useChat();
  const [inputText, setInputText] = useState('');

  const handleOrbTap = useCallback(() => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        handleSend(transcript.trim());
      }
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening, transcript]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setOrbState('processing');
      setInputText('');

      const response = await sendMessage(text);
      navigate('/chat');

      if (response.text) {
        await speak(response.text.replace(/[*#]/g, ''));
      }
      setOrbState('idle');
    },
    [sendMessage, navigate, speak, setOrbState]
  );

  const handleChipClick = useCallback(
    (label: string) => {
      handleSend(label);
    },
    [handleSend]
  );

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)] bg-bg">
      {/* Top Bar — matching ref: icon left, title center, bell + profile right */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-bg flex items-center justify-center">
            <Plus size={16} className="text-primary" />
          </div>
        </div>
        <p className="text-sm font-semibold text-primary">MedPulse Assistant</p>
        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-xl hover:bg-bg-secondary transition-colors">
            <Bell size={20} className="text-text-secondary" />
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-accent rounded-full ring-2 ring-white" />
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-5 pt-4">
        <p className="text-lg font-semibold text-text">
          {getGreeting()}, <span className="text-primary">Alex</span> 👋
        </p>
        <p className="text-sm text-text-secondary mt-0.5">How can I help you today?</p>
      </div>

      {/* Voice Orb Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-2">
        <VoiceOrb state={orbState} onTap={handleOrbTap} size={240} />

        {/* Status Label */}
        <div className="flex items-center gap-2 mt-2 mb-6">
          <div
            className={`w-2 h-2 rounded-full transition-all ${
              orbState === 'idle'
                ? 'bg-primary pulse-soft'
                : orbState === 'listening'
                ? 'bg-green-accent animate-ping'
                : orbState === 'processing'
                ? 'bg-primary animate-spin'
                : 'bg-green-accent animate-pulse'
            }`}
          />
          <span className="text-xs text-text-muted font-medium">
            {orbState === 'idle' && 'Tap to start'}
            {orbState === 'listening' && (transcript || 'Listening...')}
            {orbState === 'processing' && 'Processing...'}
            {orbState === 'speaking' && 'Speaking...'}
          </span>
        </div>

        {/* Suggestion Chips */}
        <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
          {suggestions.map((chip) => (
            <SuggestionChip
              key={chip.label}
              emoji={chip.emoji}
              label={chip.label}
              onClick={() => handleChipClick(chip.label)}
            />
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-center gap-2 bg-bg-secondary border border-border rounded-2xl px-4 py-2.5">
          <input
            id="home-text-input"
            type="text"
            placeholder="Ask about your health data..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
          />
          <button
            onClick={handleOrbTap}
            className={`p-2 rounded-xl transition-all ${
              isListening ? 'bg-primary text-white' : 'hover:bg-primary-bg text-primary'
            }`}
          >
            <Mic size={18} />
          </button>
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
