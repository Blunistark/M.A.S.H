import { Request, Response } from 'express';
import { AGENTS_URL } from '../config/env';

export async function getTelemetryState(req: Request, res: Response): Promise<void> {
  try {
    const { doctorId, doctorName } = req.query;
    const urlParams = doctorId && doctorName
      ? `?doctorId=${encodeURIComponent(doctorId as string)}&doctorName=${encodeURIComponent(doctorName as string)}`
      : '';
    const agentResponse = await globalThis.fetch(`${AGENTS_URL}/api/telemetry/state${urlParams}`);
    if (agentResponse.ok) {
      const data = await agentResponse.json();
      res.json(data);
      return;
    } else {
      res.status(agentResponse.status).json({ message: 'Error from agents server' });
      return;
    }
  } catch (err: any) {
    console.error('Error fetching telemetry state from python server:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}
