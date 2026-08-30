import React, { createContext, useContext, useState, useEffect } from 'react';
import { telemetryClient, TelemetryEvent } from '../api/events';

interface TelemetryAlert {
  id: string;
  trainCode: string;
  delayMinutes: number;
  rescheduleRequired: boolean;
  actionAdvised: string;
  timestamp: string;
  read: boolean;
}

interface TelemetryContextType {
  isConnected: boolean;
  alerts: TelemetryAlert[];
  activePopupAlert: TelemetryAlert | null;
  dismissPopupAlert: () => void;
  markAlertsAsRead: () => void;
  simulateDelay: (trainCode: string, delayMinutes: number) => void;
  openReschedulerForAlert: (alert: TelemetryAlert) => void;
  reschedulerModalAlert: TelemetryAlert | null;
  setReschedulerModalAlert: (alert: TelemetryAlert | null) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<TelemetryAlert[]>([]);
  const [activePopupAlert, setActivePopupAlert] = useState<TelemetryAlert | null>(null);
  const [reschedulerModalAlert, setReschedulerModalAlert] = useState<TelemetryAlert | null>(null);

  useEffect(() => {
    telemetryClient.connect();

    const unsubscribe = telemetryClient.subscribe((event: TelemetryEvent) => {
      if (event.event_type === 'CONNECTION_STATE') {
        setIsConnected(event.status === 'connected');
      } else if (event.event_type === 'TRAIN_DELAY_ALERT' || event.event_type === 'DISRUPTION_ALERT') {
        const newAlert: TelemetryAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          trainCode: event.train_code || '12951',
          delayMinutes: event.delay_minutes || 25,
          rescheduleRequired: event.reschedule_required ?? ((event.delay_minutes || 0) > 20),
          actionAdvised:
            event.action_advised ||
            ((event.delay_minutes || 0) > 20
              ? 'Trigger Stage 6 Fast Rescheduler & SLW Advisory'
              : 'Safety Buffer Absorbed (< 20 min)'),
          timestamp: new Date().toLocaleTimeString(),
          read: false,
        };

        setAlerts((prev) => [newAlert, ...prev]);
        setActivePopupAlert(newAlert);
      }
    });

    return () => {
      unsubscribe();
      telemetryClient.disconnect();
    };
  }, []);

  const dismissPopupAlert = () => {
    setActivePopupAlert(null);
  };

  const markAlertsAsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const simulateDelay = (trainCode: string, delayMinutes: number) => {
    telemetryClient.simulateTrainDelay(trainCode, delayMinutes);
  };

  const openReschedulerForAlert = (alert: TelemetryAlert) => {
    setReschedulerModalAlert(alert);
    setActivePopupAlert(null);
  };

  return (
    <TelemetryContext.Provider
      value={{
        isConnected,
        alerts,
        activePopupAlert,
        dismissPopupAlert,
        markAlertsAsRead,
        simulateDelay,
        openReschedulerForAlert,
        reschedulerModalAlert,
        setReschedulerModalAlert,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
