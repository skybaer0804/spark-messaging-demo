import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import type { ConnectedData } from '@skybaer0804/spark-messaging-client';

export type ConnectionStateChangeCallback = (connected: boolean) => void;
export type ConnectedCallback = (data: ConnectedData) => void;
export type ErrorCallback = (error: Error | unknown) => void;

export class ConnectionService {
    private client: SparkMessaging;
    private unsubscribeCallbacks: Array<() => void> = [];
    private isConnected: boolean = false;
    private socketId: string | null = null;

    constructor(client: SparkMessaging) {
        this.client = client;
        this.initialize();
    }

    private initialize() {
        const status = this.client.getConnectionStatus();
        this.isConnected = status.isConnected;
        this.socketId = status.socketId;
    }

    public getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            socketId: this.socketId,
        };
    }

    public onConnected(callback: ConnectedCallback): () => void {
        const unsubscribe = this.client.onConnected((data: ConnectedData) => {
            this.isConnected = true;
            this.socketId = data.socketId;
            callback(data);
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public onConnectionStateChange(callback: ConnectionStateChangeCallback): () => void {
        const unsubscribe = this.client.onConnectionStateChange((connected: boolean) => {
            this.isConnected = connected;
            if (connected) {
                const status = this.client.getConnectionStatus();
                this.socketId = status.socketId;
            } else {
                this.socketId = null;
            }
            callback(connected);
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public onError(callback: ErrorCallback): () => void {
        const unsubscribe = this.client.onError((error: Error | unknown) => {
            this.isConnected = false;
            callback(error);
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public cleanup() {
        this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
        this.unsubscribeCallbacks = [];
    }
}
