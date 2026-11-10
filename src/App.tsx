import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import AuthProvider from '@/components/AuthProvider';
import SettingsProvider from '@/components/SettingsProvider';
import GameScreen from '@/screens/GameScreen';
import GamesScreen from '@/screens/GamesScreen';
import HomeScreen from '@/screens/HomeScreen';
import NotFoundScreen from '@/screens/NotFoundScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import GameSettingsScreen from '@/screens/GameSettingsScreen';
import AuthScreen from '@/screens/AuthScreen';
import SocialScreen from '@/screens/SocialScreen';
import ShopScreen from '@/screens/ShopScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import StatsScreen from '@/screens/StatsScreen';
import StatsProvider from '@/components/StatsProvider';

const RulesScreen = lazy(() => import('@/screens/RulesScreen'));

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <StatsProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomeScreen />} />
                <Route path="/games" element={<GamesScreen />} />
                <Route
                  path="/games/:gameId/rules"
                  element={
                    <Suspense fallback={<p role="status">Loading rules…</p>}>
                      <RulesScreen />
                    </Suspense>
                  }
                />
                <Route path="/games/:gameId/settings" element={<GameSettingsScreen />} />
                <Route path="/games/:gameId" element={<GameScreen />} />
                <Route path="/settings" element={<SettingsScreen />} />
                <Route path="/stats" element={<StatsScreen />} />
                <Route path="/login" element={<AuthScreen initialMode="login" />} />
                <Route path="/signup" element={<AuthScreen initialMode="signup" />} />
                <Route path="/social" element={<SocialScreen />} />
                <Route path="/shop" element={<ShopScreen />} />
                <Route path="/profile" element={<ProfileScreen />} />
                <Route path="*" element={<NotFoundScreen />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </StatsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
