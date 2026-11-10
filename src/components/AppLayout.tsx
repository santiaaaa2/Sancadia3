import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopNav from '@/components/TopNav';
import PwaNotifications from '@/components/PwaNotifications';

export default function AppLayout() {
  const location = useLocation();
  const isLatrunculi = location.pathname.startsWith('/games/latrunculi');

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <TopNav />
      <div
        className={`mx-auto flex w-full flex-1 flex-col px-5 pt-4 ${
          isLatrunculi ? 'max-w-6xl lg:px-8' : 'max-w-md'
        }`}
      >
        <main key={location.pathname} className="flex flex-1 flex-col animate-fade-in">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <div className="h-[max(0.5rem,env(safe-area-inset-bottom))] bg-background" />
      <PwaNotifications />
    </div>
  );
}
