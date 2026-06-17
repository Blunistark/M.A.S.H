import { useState, useEffect, useCallback } from 'react';
import { Message, Doctor } from '../types';
import { routeIntent } from '../services/intentRouter';
import { api } from '../services/api';
import { useTextToSpeech } from './useTextToSpeech';

export function useChat(
  patientId: string,
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { speak, stop, isSpeaking } = useTextToSpeech(onStateChange);



  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // Set state to processing
    onStateChange('processing');

    try {
      // Route intent and get structured reply
      const reply = await routeIntent(text, patientId);

      // Add assistant message
      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: reply.responseText,
        timestamp: new Date(),
        cardType: reply.cardType,
        cardData: reply.cardData
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Speak response aloud
      await speak(reply.responseText);

    } catch (err) {
      console.error('Error sending message:', err);
      const errMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errMsg]);
      onStateChange('idle');
    }
  }, [patientId, speak, onStateChange]);

  const selectDoctorSlot = useCallback(async (doctor: Doctor, slot: string, isRescheduling?: boolean, oldApptId?: string) => {
    onStateChange('processing');
    
    // Simulate booking
    const dateStr = new Date();
    dateStr.setDate(dateStr.getDate() + 2); // 2 days from now
    const timeParts = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (timeParts) {
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const ampm = timeParts[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      dateStr.setHours(hours, minutes, 0, 0);
    }

    try {
      const appt = await api.bookAppointment(patientId, doctor.id, dateStr.toISOString());
      
      const successText = isRescheduling
        ? `Done! I have rescheduled your appointment with ${doctor.full_name}. Your new appointment is on ${dateStr.toLocaleDateString()} at ${slot} in ${doctor.room_number}.`
        : `Success! I have booked your appointment with ${doctor.full_name} for ${dateStr.toLocaleDateString()} at ${slot}. Your visit is scheduled in ${doctor.room_number}.`;

      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: successText,
        timestamp: new Date(),
        cardType: 'appointment',
        cardData: appt
      };

      setMessages(prev => [...prev, assistantMsg]);
      await speak(successText);
    } catch (err) {
      console.error(err);
      onStateChange('idle');
    }
  }, [patientId, speak, onStateChange]);

  return {
    messages,
    sendMessage,
    selectDoctorSlot,
    isSpeaking,
    stopSpeaking: stop
  };
}
