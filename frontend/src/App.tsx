import { useEffect } from 'react';
import { RouterProvider, createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { UserProvider } from './contexts/UserContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import TimetableUpload from './pages/TimetableUpload';
import TimetableManual from './pages/TimetableManual';
import Assignments from './pages/Assignments';
import DayTracker from './pages/DayTracker';
import InstallBanner from './components/InstallBanner';

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: Chat,
});

const timetableUploadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timetable/upload',
  component: TimetableUpload,
});

const timetableManualRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timetable/manual',
  component: TimetableManual,
});

const assignmentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/assignments',
  component: Assignments,
});

const dayTrackerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/day-tracker',
  component: DayTracker,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  chatRoute,
  timetableUploadRoute,
  timetableManualRoute,
  assignmentsRoute,
  dayTrackerRoute,
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.info('Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <UserProvider>
        <ServiceWorkerRegistrar />
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
        <InstallBanner />
      </UserProvider>
    </ThemeProvider>
  );
}
