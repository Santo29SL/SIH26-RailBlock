import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DivisionProvider } from './context/DivisionContext';
import { TelemetryProvider } from './context/TelemetryContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { GanttPage } from './pages/GanttPage';
import { MapViewPage } from './pages/MapViewPage';
import { SimulationPage } from './pages/SimulationPage';
import { MultiHorizonPage } from './pages/MultiHorizonPage';
import { StatutoryPage } from './pages/StatutoryPage';
import { AIRiskPage } from './pages/AIRiskPage';
import { IngestionPage } from './pages/IngestionPage';
import { AdminPage } from './pages/AdminPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MainContent: React.FC = () => {
  const { user } = useAuth();
  // Open directly to the Control Office Software workspace
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // If user is on the Landing Page, render full-screen Landing view
  if (activeTab === 'landing') {
    return (
      <ErrorBoundary>
        <LandingPage onOpenDashboard={() => setActiveTab('dashboard')} />
      </ErrorBoundary>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigateTab={setActiveTab} />;
      case 'gantt':
        return <GanttPage />;
      case 'map':
        return <MapViewPage onNavigateTab={setActiveTab} />;
      case 'simulator':
        return <SimulationPage />;
      case 'multi-horizon':
        return <MultiHorizonPage />;
      case 'statutory':
        return <StatutoryPage />;
      case 'ai-risk':
        return <AIRiskPage />;
      case 'ingestion':
        return <IngestionPage />;
      case 'admin':
        return <AdminPage />;
      default:
        return <DashboardPage onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <ErrorBoundary>
        {renderTabContent()}
      </ErrorBoundary>
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DivisionProvider>
            <TelemetryProvider>
              <MainContent />
            </TelemetryProvider>
          </DivisionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
export default App;
