import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import MainMenuPage from './pages/MainMenuPage';
import TutorialPage from './pages/TutorialPage';
import CreateRoomPage from './pages/CreateRoomPage';
import WaitingRoomPage from './pages/WaitingRoomPage';
import QuickMatchPage from './pages/QuickMatchPage';
import JoinRoomPage from './pages/JoinRoomPage';
import StatsPage from './pages/StatsPage';
import ReplayPage from './pages/ReplayPage';
import ErrorBoundary from './utils/ErrorBoundary';
import ConnectionMonitor from './utils/ConnectionMonitor';
import PWAInstallButton from './components/PWAInstallButton';
import { initializeIOSCompatibility } from './utils/iOSCompatibility';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  useEffect(() => {
    // iOS互換性機能を初期化
    initializeIOSCompatibility();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gray-900 text-white touch-manipulation">
            <ConnectionMonitor />
            <PWAInstallButton />
            <Routes>
              <Route path="/" element={<ErrorBoundary><MainMenuPage /></ErrorBoundary>} />
              <Route path="/old-home" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
              <Route path="/tutorial" element={<ErrorBoundary><TutorialPage /></ErrorBoundary>} />
              <Route path="/quick-match" element={<ErrorBoundary><QuickMatchPage /></ErrorBoundary>} />
              <Route path="/create-room" element={<ErrorBoundary><CreateRoomPage /></ErrorBoundary>} />
              <Route path="/join-room" element={<ErrorBoundary><JoinRoomPage /></ErrorBoundary>} />
              <Route path="/waiting-room" element={<ErrorBoundary><WaitingRoomPage /></ErrorBoundary>} />
              <Route path="/stats" element={<ErrorBoundary><StatsPage /></ErrorBoundary>} />
              <Route path="/replay/:gameId" element={<ErrorBoundary><ReplayPage /></ErrorBoundary>} />
              <Route path="/game" element={<ErrorBoundary><GamePage /></ErrorBoundary>} />
              <Route path="/game/:gameId" element={<ErrorBoundary><GamePage /></ErrorBoundary>} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;