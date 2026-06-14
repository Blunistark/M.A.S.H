"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Telemetry = void 0;
class Telemetry {
    static log(agentName, action, data) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            agent: agentName,
            action,
            data,
        };
        // In a real scenario, send this to a telemetry endpoint or datadog/etc.
        console.log(`[TELEMETRY] ${JSON.stringify(logEntry)}`);
    }
    static trackHandoff(from, to, context) {
        this.log(from, 'HANDOFF', { to, context });
    }
    static trackEvent(agentName, event, payload) {
        this.log(agentName, 'EVENT', { event, payload });
    }
}
exports.Telemetry = Telemetry;
