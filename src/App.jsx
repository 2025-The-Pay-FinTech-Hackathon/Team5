import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { Suspense, lazy, useEffect, useState } from 'react';
import { lightTheme } from './theme/theme';
import { AuthProvider } from './contexts/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorMessage from './components/common/ErrorMessage';
import { connectRealtime } from './services/realtime';
import { loadNotifications } from './utils/notificationUtils';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const ParentLayout = lazy(() => import('./layouts/ParentLayout'));
const ChildLayout = lazy(() => import('./layouts/ChildLayout'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const ChildDashboard = lazy(() => import('./pages/ChildDashboard'));
const Quiz = lazy(() => import('./pages/Quiz'));
const Missions = lazy(() => import('./pages/Missions'));
const Savings = lazy(() => import('./pages/Savings'));
const Store = lazy(() => import('./pages/Store'));
const MyPage = lazy(() => import('./pages/MyPage'));
const Ledger = lazy(() => import('./pages/Ledger'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const BadgePage = lazy(() => import('./pages/BadgePage'));
const MemoryGame = lazy(() => import('./pages/MemoryGame'));
const ParentReportPage = lazy(() => import('./pages/ParentReportPage'));
const MessageCenter = lazy(() => import('./components/message/MessageCenter'));
const FinancialEducation = lazy(() => import('./components/education/FinancialEducation'));
const PerformanceAnalytics = lazy(() => import('./components/analytics/PerformanceAnalytics'));
const SocialFeatures = lazy(() => import('./components/social/SocialFeatures'));
const LoanManagement = lazy(() => import('./components/parent/LoanManagement'));
const LoanApplication = lazy(() => import('./components/child/LoanApplication'));
const LazyFirestoreProvider = lazy(() =>
  import('./contexts/FirestoreContext').then((module) => ({
    default: module.FirestoreProvider,
  })),
);

function FirestoreRoute({ children }) {
  return <LazyFirestoreProvider>{children}</LazyFirestoreProvider>;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
      window.dispatchEvent(new Event('auth:user-changed'));
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    window.dispatchEvent(new Event('auth:user-changed'));
  };

  useEffect(() => {
    const syncStoredUser = () => {
      const storedUser = sessionStorage.getItem('user');

      if (!storedUser) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.warn('Failed to restore stored user:', err);
        sessionStorage.removeItem('user');
        setUser(null);
      }
    };

    syncStoredUser();

    window.addEventListener('auth:user-changed', syncStoredUser);
    window.addEventListener('storage', syncStoredUser);

    return () => {
      window.removeEventListener('auth:user-changed', syncStoredUser);
      window.removeEventListener('storage', syncStoredUser);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;

    loadNotifications(user.id);
    return connectRealtime(user.id);
  }, [user?.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: { background: '#F8F8FF' },
          '.MuiPaper-root': { background: '#fff' },
        }}
      />
      <AuthProvider>
        <Router>
          {error && <ErrorMessage title="Error" message={error} />}
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route
                path="/"
                element={
                  user ? (
                    <Navigate to={user.role === 'parent' ? '/parent' : '/child'} replace />
                  ) : (
                    <Login onLogin={handleLogin} />
                  )
                }
              />
              <Route path="/signup" element={<Signup />} />

              <Route
                path="/parent/*"
                element={
                  user?.role === 'parent' ? (
                    <ParentLayout user={user} onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              >
                <Route index element={<ParentDashboard />} />
                <Route path="messages" element={<MessageCenter />} />
                <Route path="education" element={<FinancialEducation />} />
                <Route path="analytics" element={<PerformanceAnalytics />} />
                <Route path="social" element={<SocialFeatures />} />
                <Route path="missions" element={<Missions />} />
                <Route path="savings" element={<Savings />} />
                <Route path="report" element={<ParentReportPage />} />
                <Route path="mypage" element={<MyPage user={user} onUserUpdate={setUser} onLogout={handleLogout} />} />
                <Route path="ledger" element={<Ledger />} />
                <Route path="badges" element={<BadgePage />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route
                  path="loan"
                  element={
                    <FirestoreRoute>
                      <LoanManagement />
                    </FirestoreRoute>
                  }
                />
              </Route>

              <Route
                path="/child/*"
                element={
                  user?.role === 'child' ? (
                    <ChildLayout user={user} onLogout={handleLogout} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              >
                <Route index element={<ChildDashboard />} />
                <Route path="messages" element={<MessageCenter />} />
                <Route path="education" element={<FinancialEducation />} />
                <Route path="analytics" element={<PerformanceAnalytics />} />
                <Route path="social" element={<SocialFeatures />} />
                <Route path="quiz" element={<Quiz />} />
                <Route path="missions" element={<Missions />} />
                <Route path="savings" element={<Savings />} />
                <Route path="store" element={<Store />} />
                <Route path="mypage" element={<MyPage user={user} onUserUpdate={setUser} onLogout={handleLogout} />} />
                <Route path="ledger" element={<Ledger />} />
                <Route path="badges" element={<BadgePage />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route
                  path="loan"
                  element={
                    <FirestoreRoute>
                      <LoanApplication />
                    </FirestoreRoute>
                  }
                />
              </Route>

              <Route path="/memory-game" element={<MemoryGame />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
