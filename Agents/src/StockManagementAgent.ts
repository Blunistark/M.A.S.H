import { HealthcareOrchestrationRoom, BandSDK, BandAgent } from './band_config';
import { Telemetry } from './Telemetry';

export class StockManagementAgent {
  private agent: BandAgent;
  private stockUsage: Record<string, number> = {};
  private readonly REORDER_THRESHOLD = 2; // threshold for repeatedly used stock suggestion

  constructor() {
    this.agent = BandSDK.createAgent('StockManagementAgent');
    HealthcareOrchestrationRoom.join(this.agent);
    
    this.setupListeners();
  }

  private setupListeners() {
    // Listen for medicine being routed to pharma (stock usage)
    this.agent.onEvent('ROUTE_TO_PHARMA', async (payload: { patientId: string, prescription: { medicine: string } }) => {
      const medicine = payload.prescription.medicine;
      
      // Track stock usage
      this.stockUsage[medicine] = (this.stockUsage[medicine] || 0) + 1;
      Telemetry.trackEvent(this.agent.name, 'STOCK_USAGE_INCREMENTED', { medicine, count: this.stockUsage[medicine] });

      // Suggest for repeatedly used stock if it meets threshold
      if (this.stockUsage[medicine] >= this.REORDER_THRESHOLD) {
        Telemetry.trackEvent(this.agent.name, 'SUGGEST_STOCK_REORDER', { medicine, count: this.stockUsage[medicine] });
        HealthcareOrchestrationRoom.broadcast('REORDER_SUGGESTION', {
          medicine,
          reason: `Medicine '${medicine}' is repeatedly used (${this.stockUsage[medicine]} times). Suggest restocking.`,
          currentUsage: this.stockUsage[medicine]
        });
      }
    });

    // Query current stock usage stats
    this.agent.onEvent('GET_STOCK_STATS', () => {
      HealthcareOrchestrationRoom.broadcast('STOCK_STATS_RESPONSE', { stats: this.stockUsage });
    });
  }
}
