import { Request, Response } from 'express';
import { SARVAM_API_KEY } from '../config/env';

export async function generateSpeech(req: Request, res: Response): Promise<void> {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400).json({ message: 'Text is required' });
      return;
    }

    if (!SARVAM_API_KEY) {
      res.status(500).json({ message: 'SARVAM_API_KEY is not configured' });
      return;
    }

    const response = await globalThis.fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [text.substring(0, 500)],
        target_language_code: 'en-IN',
        speaker: 'anushka',
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1'
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Sarvam API error:', errText);
      res.status(response.status).json({ message: 'Error from Sarvam API', details: errText });
      return;
    }

    interface SarvamResponse {
      audios: string[];
    }
    const resData = (await response.json()) as SarvamResponse;
    if (!resData.audios || resData.audios.length === 0) {
      res.status(500).json({ message: 'No audio returned from Sarvam API' });
      return;
    }

    const audioBase64 = resData.audios[0];
    const buffer = Buffer.from(audioBase64, 'base64');

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString()
    });
    res.send(buffer);
  } catch (err: any) {
    console.error('TTS error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}
