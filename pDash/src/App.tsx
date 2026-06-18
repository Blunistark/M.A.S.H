import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { ChatScreen } from './screens/ChatScreen';
import { NavigateScreen } from './screens/NavigateScreen';
import { ProfileScreen } from './screens/ProfileScreen';

function App() {
  return (
    <BrowserRouter>
      <div className="relative max-w-lg mx-auto min-h-dvh bg-dark-bg">
        <main className="pb-16">
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/chat" element={<ChatScreen />} />
            <Route path="/navigate" element={<NavigateScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
