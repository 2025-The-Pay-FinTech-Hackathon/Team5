import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { useState } from 'react';
import lottie from 'lottie-web';
import { defineElement } from 'lord-icon-element';
import { lightTheme } from './theme/theme';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorMessage from './components/common/ErrorMessage';
import NotificationCenter from './components/notifications/NotificationCenter';
import MessageCenter from './components/messages/MessageCenter';
import FinancialEducation from './components/education/FinancialEducation';
import PerformanceAnalytics from './components/analytics/PerformanceAnalytics';
import SocialFeatures from './components/social/SocialFeatures';

// Layouts
import ParentLayout from './layouts/ParentLayout';
import ChildLayout from './layouts/ChildLayout';

// Pages
import Login from './pages/Login';
import ParentDashboard from './pages/ParentDashboard';
import ChildDashboard from './pages/ChildDashboard';
import Quiz from './pages/Quiz';
import Missions from './pages/Missions';
import Savings from './pages/Savings';
import Store from './pages/Store';
import Signup from './pages/Signup';
import MyPage from './pages/MyPage';
import Ledger from './pages/Ledger';
import Wishlist from './pages/Wishlist';
import BadgePage from './pages/BadgePage';
import MemoryGame from './pages/MemoryGame';
import ParentReportPage from './pages/ParentReportPage';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser(userData);
      sessionStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
  };

  // Check for stored user data on initial load
  useState(() => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <GlobalStyles styles={{
        body: { background: '#F8F8FF' },
        '.MuiPaper-root': { background: '#fff' },
      }} />
      <Router>
        {error && <ErrorMessage title="오류" message={error} />}
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
          
          {/* Parent Routes */}
          <Route
            path="/parent/*"
            element={
              user?.role === 'parent' ? (
                <ParentLayout user={user} onLogout={handleLogout}>
                  <Outlet />
                </ParentLayout>
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
            <Route path="mypage" element={<MyPage user={user} onUserUpdate={setUser} />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="badges" element={<BadgePage />} />
            <Route path="wishlist" element={<Wishlist />} />
          </Route>
          
          {/* Child Routes */}
          <Route
            path="/child/*"
            element={
              user?.role === 'child' ? (
                <ChildLayout user={user} onLogout={handleLogout}>
                  <Outlet />
                </ChildLayout>
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
            <Route path="mypage" element={<MyPage user={user} onUserUpdate={setUser} />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="badges" element={<BadgePage />} />
            <Route path="wishlist" element={<Wishlist />} />
          </Route>
          
          {/* Common Routes */}
          <Route path="/memory-game" element={<MemoryGame />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
