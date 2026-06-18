import { type View, Router } from '../router';
import { getIcon } from '../assets/icons';

interface TelemetryEvent {
  id: string;
  type: 'AGENT_JOINED' | 'STATE_UPDATED' | 'HUMAN_INTERVENTION_REQUESTED' | 'RESOLVED';
  timestamp: string;
  details: string;
  agent?: string;
  room?: string;
}

export class TelemetryView implements View {
  private events: TelemetryEvent[] = [
    {
      id: '1',
      type: 'AGENT_JOINED',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      agent: 'SummaryAgent',
      room: 'Doctor-Dashboard-Room',
      details: "Agent 'SummaryAgent' joined room 'Doctor-Dashboard-Room'"
    },
    {
      id: '2',
      type: 'STATE_UPDATED',
      timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
      room: 'Pharmacy-Inventory-Room',
      details: "Room 'Pharmacy-Inventory-Room': key 'inventory_last_checked' updated to '2026-06-18T08:50:00Z'"
    },
    {
      id: '3',
      type: 'AGENT_JOINED',
      timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      agent: 'MedicineManagementAgent',
      room: 'Pharmacy-Inventory-Room',
      details: "Agent 'MedicineManagementAgent' joined room 'Pharmacy-Inventory-Room'"
    },
    {
      id: '4',
      type: 'HUMAN_INTERVENTION_REQUESTED',
      timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      agent: 'MedicineManagementAgent',
      details: "Medicine 'rare-antibiotic' is out of stock. Alternate prescription required."
    },
    {
      id: '5',
      type: 'RESOLVED',
      timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
      agent: 'MedicineManagementAgent',
      details: "approved - Comments: Doctor reviewed and approved alternative."
    }
  ];

  async render(_params?: any): Promise<string> {
    return `
      <div class="page-header" style="padding: 32px 40px 16px 40px;">
        <div class="header-title-block">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(16, 185, 129, 0.1); color: #10b981; display: flex; align-items: center; justify-content: center;">
              ${getIcon('activity')}
            </div>
            <h1 class="page-title">Live Telemetry</h1>
          </div>
          <p class="page-subtitle">Real-time audit log of multi-agent activities and state changes</p>
        </div>
      </div>

      <div class="telemetry-dashboard" style="padding: 0 40px 40px 40px;">
        <div class="card" style="background: #1e293b; color: #f8fafc; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <div class="card-header" style="border-bottom: 1px solid #334155; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 16px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span class="pulse-indicator" style="width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; display: inline-block;"></span>
              Telemetry-Audit-Room Stream
            </h3>
            <span style="font-size: 12px; color: #94a3b8; font-family: monospace;">STATUS: CONNECTED</span>
          </div>
          <div class="card-body" style="padding: 0; max-height: 600px; overflow-y: auto;">
            <ul style="list-style: none; padding: 0; margin: 0; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 13px;">
              ${this.events.map(event => this.renderEvent(event)).join('')}
            </ul>
          </div>
        </div>
      </div>
      
      <style>
        .telemetry-event-row {
          padding: 16px 24px;
          border-bottom: 1px solid #334155;
          display: flex;
          gap: 16px;
          transition: background-color 0.2s;
        }
        .telemetry-event-row:hover {
          background-color: #0f172a;
        }
        .telemetry-event-row:last-child {
          border-bottom: none;
        }
        .telemetry-time {
          color: #64748b;
          min-width: 140px;
        }
        .telemetry-type {
          font-weight: 600;
          min-width: 180px;
        }
        .type-AGENT_JOINED { color: #3b82f6; }
        .type-STATE_UPDATED { color: #8b5cf6; }
        .type-HUMAN_INTERVENTION_REQUESTED { color: #f59e0b; }
        .type-RESOLVED { color: #10b981; }
        .telemetry-details {
          color: #cbd5e1;
          flex-grow: 1;
        }
      </style>
    `;
  }

  private renderEvent(event: TelemetryEvent): string {
    const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = new Date(event.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    return `
      <li class="telemetry-event-row">
        <div class="telemetry-time">[${date} ${time}]</div>
        <div class="telemetry-type type-${event.type}">[${event.type}]</div>
        <div class="telemetry-details">${event.details}</div>
      </li>
    `;
  }

  onMount(_container: HTMLElement, _router: Router): void {
    // Add pulsing animation styles dynamically
    if (!document.getElementById('pulse-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-style';
      style.innerHTML = `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .pulse-indicator {
          animation: pulse 2s infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
