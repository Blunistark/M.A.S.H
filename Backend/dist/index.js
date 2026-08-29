"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const telemetryProxy_1 = require("./websocket/telemetryProxy");
const server = http_1.default.createServer(app_1.default);
// Setup WebSocket proxy for telemetry streaming
(0, telemetryProxy_1.setupTelemetryWebSocketProxy)(server);
// Start HTTP server
server.listen(env_1.PORT, () => {
    console.log(`Server is running on port ${env_1.PORT}`);
});
