import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { setServerUrlCache } from './api/client';
import './index.css';

import LoginPage   from './pages/LoginPage';
import SetupWizard from './pages/SetupWizard';
import Dashboard   from './pages/Dashboard';
import AppShell    from './pages/AppShell';
import OrdersPage  from './pages/OrdersPage';
import FilamentPage from './pages/FilamentPage';
import FinancePage  from './pages/FinancePage';
import CustomersPage from './pages/CustomersPage';
import PrintersPage  from './pages/PrintersPage';
import PartsPage     from './pages/PartsPage';
import SettingsPage  from './pages/SettingsPage';
import UsersPage     from './pages/UsersPage';
import ShippingPage  from './pages/ShippingPage';
import JobQueuePage  from './pages/JobQueuePage';
import PrintHistoryPage from './pages/PrintHistoryPage';
import MarketingPage from './pages/MarketingPage';
import QuotePage     from './pages/QuotePage';
import ModelsPage    from './pages/ModelsPage';
import HelpPage      from './pages/HelpPage';
import ChangelogPage from './pages/ChangelogPage';

function AuthGuard({ children, roles }) {
  const { token, user } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Loading() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060612',
    }}>
      <div style={{ width: 32, height: 32, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#0071E3', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const { isLoading, token, init } = useAuthStore();
  const [theme, setTheme]           = useState('dark');
  const [setupDone, setSetupDone]   = useState(null);

  useEffect(() => {
    // Always local server in Lite
    setServerUrlCache('http://127.0.0.1:3001');

    async function bootstrap() {
      const savedTheme = await window.printflow.getTheme();
      setTheme(savedTheme || 'dark');

      const done = await window.printflow.getSetupComplete();
      setSetupDone(done);

      await init();
    }
    bootstrap();
  }, []);

  // Apply theme class to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (isLoading || setupDone === null) return <Loading/>;

  return (
    <HashRouter>
      <Routes>
        {/* Setup wizard — shown on first launch */}
        <Route path="/setup"
          element={!setupDone
            ? <SetupWizard onComplete={() => setSetupDone(true)}/>
            : <Navigate to="/" replace/>}
        />
        <Route path="/login"
          element={setupDone
            ? <LoginPage/>
            : <Navigate to="/setup" replace/>}
        />
        <Route path="/"
          element={
            !setupDone ? <Navigate to="/setup" replace/>
            : !token ? <Navigate to="/login" replace/>
            : <AppShell theme={theme} onThemeChange={setTheme}/>
          }
        >
          <Route index element={<Dashboard/>}/>
          <Route path="orders"  element={<OrdersPage/>}/>
          <Route path="filament" element={<FilamentPage/>}/>
          <Route path="finance" element={<AuthGuard roles={['owner','manager']}><FinancePage/></AuthGuard>}/>
          <Route path="customers" element={<CustomersPage/>}/>
          <Route path="printers"  element={<PrintersPage/>}/>
          <Route path="parts"     element={<PartsPage/>}/>
          <Route path="shipping"  element={<AuthGuard roles={['owner','manager']}><ShippingPage/></AuthGuard>}/>
          <Route path="queue"     element={<JobQueuePage/>}/>
          <Route path="history"   element={<PrintHistoryPage/>}/>
          <Route path="marketing" element={<AuthGuard roles={['owner','manager']}><MarketingPage/></AuthGuard>}/>
          <Route path="quotes"    element={<AuthGuard roles={['owner','manager']}><QuotePage/></AuthGuard>}/>
          <Route path="models"    element={<ModelsPage/>}/>
          <Route path="settings"  element={<SettingsPage onThemeChange={setTheme}/>}/>
          <Route path="users"     element={<AuthGuard roles={['owner']}><UsersPage/></AuthGuard>}/>
          <Route path="help"      element={<HelpPage/>}/>
          <Route path="changelog" element={<ChangelogPage/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </HashRouter>
  );
}
