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

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-900 text-white">
          <Routes>
            <Route path="/" element={<MainMenuPage />} />
            <Route path="/old-home" element={<HomePage />} />
            <Route path="/tutorial" element={<TutorialPage />} />
            <Route path="/quick-match" element={<QuickMatchPage />} />
            <Route path="/create-room" element={<CreateRoomPage />} />
            <Route path="/join-room" element={<JoinRoomPage />} />
            <Route path="/waiting-room" element={<WaitingRoomPage />} />
            <Route path="/game" element={<GamePage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;