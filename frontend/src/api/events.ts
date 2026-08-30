export interface TelemetryEvent {
  event_type: string;
  status?: string;
  message?: string;
  train_code?: string;
  delay_minutes?: number;
  reschedule_required?: boolean;
  action_advised?: string;
  timestamp?: string;
  received?: any;
}

type EventListener = (event: TelemetryEvent) => void;

class TelemetryWebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<EventListener> = new Set();
  private reconnectInterval = 5000;
  private isExplicitlyClosed = false;
  private url: string;

  constructor() {
    const isHttps = window.location.protocol === 'https:';
    const host = window.location.hostname;
    const wsPort = 8000;
    this.url = `${isHttps ? 'wss' : 'ws'}://${host}:${wsPort}/api/v1/events/ws/telemetry`;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isExplicitlyClosed = false;
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('📡 Connected to RailBlock COA Live Telemetry Stream');
        this.notifyListeners({
          event_type: 'CONNECTION_STATE',
          status: 'connected',
          message: 'Connected to live telemetry stream',
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('Telemetry stream closed');
        this.notifyListeners({
          event_type: 'CONNECTION_STATE',
          status: 'disconnected',
          message: 'Telemetry stream disconnected',
        });
        if (!this.isExplicitlyClosed) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Telemetry stream error:', err);
      };
    } catch (e) {
      console.error('WebSocket connection initialization error:', e);
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public subscribe(listener: EventListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(event: TelemetryEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in telemetry event listener:', err);
      }
    });
  }

  public simulateTrainDelay(trainCode: string, delayMinutes: number) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          command: 'SIMULATE_TRAIN_DELAY',
          train_code: trainCode,
          delay_minutes: delayMinutes,
        })
      );
    } else {
      console.warn('WebSocket not connected; firing synthetic local event');
      this.notifyListeners({
        event_type: 'TRAIN_DELAY_ALERT',
        train_code: trainCode,
        delay_minutes: delayMinutes,
        reschedule_required: delayMinutes > 20,
        action_advised: delayMinutes > 20 ? 'Trigger Stage 6 Fast Rescheduler' : 'Safety Buffer Absorbed',
      });
    }
  }

  public ping() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ command: 'PING' }));
    }
  }
}

export const telemetryClient = new TelemetryWebSocketClient();
