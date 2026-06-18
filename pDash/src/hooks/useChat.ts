import { useState, useCallback } from 'react';
import { sendChatMessage } from '../services/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  data?: unknown;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (text: string) => Promise<ChatMessage>;
  clearMessages: () => void;
}

let msgCounter = 0;

function createId(): string {
  return `msg-${Date.now()}-${++msgCounter}`;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "Hello! 👋 I'm your healthcare assistant. How can I help you today? You can ask me to book appointments, find doctors, check prescriptions, or navigate the hospital.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (text: string): Promise<ChatMessage> => {
    // Add user message
    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text);

      const assistantMsg: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: response.text,
        timestamp: new Date(),
        data: response.data,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);

      return assistantMsg;
    } catch {
      const errorMsg: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: "I'm sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMsg]);
      setIsLoading(false);

      return errorMsg;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        text: "Hello! 👋 I'm your healthcare assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return { messages, isLoading, sendMessage, clearMessages };
}
