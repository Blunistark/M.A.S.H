/**
 * Google Gemini API Configuration for Speech-to-Text
 *
 * Uses Gemini's multimodal capabilities to transcribe audio.
 * Replace the placeholder below with your real Gemini API key
 * from https://aistudio.google.com/app/apikey
 */

export const GEMINI_API_KEY = 'AQ.Ab8RN6KoRXINe-NJxpMpPXivvI3l4tkaNg3oW56S4kfQYR1DvQ';

export const GEMINI_STT_MODEL = 'gemini-2.0-flash';

export const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_STT_MODEL}:generateContent`;
