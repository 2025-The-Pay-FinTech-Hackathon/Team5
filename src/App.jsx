import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { useState } from 'react';
import lottie from 'lottie-web';
import { defineElement } from 'lord-icon-element';
import { lightTheme } from './theme/theme';

// Components
import Navigation from './components/Navigation';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorMessage from './components/common/ErrorMessage';
import NotificationCenter from './components/notifications/NotificationCenter';
import MessageCenter from './components/messages/MessageCenter';
import FinancialEducation from './components/education/FinancialEducation';
import PerformanceAnalytics from './components/analytics/PerformanceAnalytics';
import SocialFeatures from './components/social/SocialFeatures';

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
          <Route 
            path="/signup" 
            element={<Signup />} 
          />
          {/* Parent Routes */}
          <Route
            path="/parent"
            element={
              user?.role === 'parent' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <NotificationCenter />
                  <ParentDashboard />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/parent/messages"
            element={
              user?.role === 'parent' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <MessageCenter />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/parent/education"
            element={
              user?.role === 'parent' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <FinancialEducation />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/parent/analytics"
            element={
              user?.role === 'parent' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <PerformanceAnalytics />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/parent/social"
            element={
              user?.role === 'parent' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <SocialFeatures />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          {/* Child Routes */}
          <Route
            path="/child"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <NotificationCenter />
                  <ChildDashboard />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/messages"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <MessageCenter />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/education"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <FinancialEducation />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/analytics"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <PerformanceAnalytics />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/social"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <SocialFeatures />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/parent/missions"
            element={
              user?.role === 'parent' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Missions />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/parent/savings"
            element={
              user?.role === 'parent' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Savings />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/quiz"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Quiz />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/missions"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Missions />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/savings"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Savings />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/child/store"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Store />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/mypage"
            element={
              user ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <MyPage user={user} onUserUpdate={setUser} />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/ledger"
            element={
              user ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Ledger />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/badges"
            element={
              user ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <BadgePage />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/memory-game" element={<MemoryGame />} />
          <Route path="/parent/report" element={<ParentReportPage />} />
          <Route
            path="/wishlist"
            element={
              user ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <Wishlist />
                </>
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
