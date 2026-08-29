import http from 'http';
import app from './app';
import { PORT } from './config/env';
import { setupTelemetryWebSocketProxy } from './websocket/telemetryProxy';

const server = http.createServer(app);

// Setup WebSocket proxy for telemetry streaming
setupTelemetryWebSocketProxy(server);

// Start HTTP server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
