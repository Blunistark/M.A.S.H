export class Telemetry {
  static log(agentName: string, action: string, data: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      agent: agentName,
      action,
      data,
    };
    // In a real scenario, send this to a telemetry endpoint or datadog/etc.
    console.log(`[TELEMETRY] ${JSON.stringify(logEntry)}`);
  }

  static trackHandoff(from: string, to: string, context: any) {
    this.log(from, 'HANDOFF', { to, context });
  }

  static trackEvent(agentName: string, event: string, payload: any) {
    this.log(agentName, 'EVENT', { event, payload });
  }
}
