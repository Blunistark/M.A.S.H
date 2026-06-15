export interface BandRoom {
    id: string;
    name: string;
    agents: BandAgent[];
    state: Record<string, any>;
    join(agent: BandAgent): void;
    broadcast(event: string, payload: any): void;
    updateState(key: string, value: any): void;
}
export interface BandAgent {
    id: string;
    name: string;
    room?: BandRoom;
    onEvent(event: string, handler: (payload: any) => void): void;
    emit(event: string, payload: any): void;
    requestHumanIntervention(reason: string, context: any): Promise<any>;
}
export declare class BandSDK {
    static createRoom(name: string): BandRoom;
    static createAgent(name: string): BandAgent;
}
export declare const HealthcareOrchestrationRoom: BandRoom;
//# sourceMappingURL=band_config.d.ts.map