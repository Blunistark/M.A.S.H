import http from 'http';
import { WebSocketServer, WebSocket as WSWebSocket } from 'ws';
import { AGENTS_URL } from '../config/env';

export function setupTelemetryWebSocketProxy(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (clientWs, req) => {
    const targetBaseUrl = AGENTS_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
    const targetWs = new WSWebSocket(`${targetBaseUrl}/api/telemetry-stream`);

    targetWs.on('open', () => {
      clientWs.on('message', (message, isBinary) => {
        if (targetWs.readyState === WSWebSocket.OPEN) {
          targetWs.send(message, { binary: isBinary });
        }
      });

      targetWs.on('message', (message, isBinary) => {
        if (clientWs.readyState === WSWebSocket.OPEN) {
          clientWs.send(message, { binary: isBinary });
        }
      });
    });

    clientWs.on('close', () => {
      targetWs.close();
    });

    targetWs.on('close', () => {
      clientWs.close();
    });

    clientWs.on('error', (err) => {
      console.error('Client WS error:', err);
      targetWs.close();
    });

    targetWs.on('error', (err) => {
      console.error('Target WS error:', err);
      clientWs.close();
    });
  });

  // Proxy websocket connections to Python agents server
  server.on('upgrade', (req, socket, head) => {
    if (req.url && req.url.startsWith('/api/telemetry-stream')) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  });

  return wss;
}
