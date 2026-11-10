import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import AuthProvider from '@/components/AuthProvider';
import SettingsProvider from '@/components/SettingsProvider';
import StatsProvider from '@/components/StatsProvider';

const GameScreen = lazy(() => import('@/screens/GameScreen'));
const GamesScreen = lazy(() => import('@/screens/GamesScreen'));
const HomeScreen = lazy(() => import('@/screens/HomeScreen'));
const NotFoundScreen = lazy(() => import('@/screens/NotFoundScreen'));
const SettingsScreen = lazy(() => import('@/screens/SettingsScreen'));
const GameSettingsScreen = lazy(() => import('@/screens/GameSettingsScreen'));
const AuthScreen = lazy(() => import('@/screens/AuthScreen'));
const SocialScreen = lazy(() => import('@/screens/SocialScreen'));
const ShopScreen = lazy(() => import('@/screens/ShopScreen'));
const ProfileScreen = lazy(() => import('@/screens/ProfileScreen'));
const StatsScreen = lazy(() => import('@/screens/StatsScreen'));
const RulesScreen = lazy(() => import('@/screens/RulesScreen'));
const AdminScreen = lazy(() => import('@/screens/AdminScreen'));

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <StatsProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Suspense fallback={<p role="status">Loading page…</p>}>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/games" element={<GamesScreen />} />
                  <Route path="/games/:gameId/rules" element={<RulesScreen />} />
                  <Route path="/games/:gameId/settings" element={<GameSettingsScreen />} />
                  <Route path="/games/:gameId" element={<GameScreen />} />
                  <Route path="/settings" element={<SettingsScreen />} />
                  <Route path="/stats" element={<StatsScreen />} />
                  <Route path="/login" element={<AuthScreen initialMode="login" />} />
                  <Route path="/signup" element={<AuthScreen initialMode="signup" />} />
                  <Route path="/social" element={<SocialScreen />} />
                  <Route path="/shop" element={<ShopScreen />} />
                  <Route path="/profile" element={<ProfileScreen />} />
                  <Route path="/admin" element={<AdminScreen />} />
                  <Route path="*" element={<NotFoundScreen />} />
                </Route>
              </Routes>
            </Suspense>
          </BrowserRouter>
        </StatsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
