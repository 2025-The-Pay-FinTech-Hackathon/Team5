import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import { useState } from 'react';

// Components
import Navigation from './components/Navigation';


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



// Modern pastel theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#6C63FF', // 파스텔 블루퍼플
      light: '#A393F9',
      dark: '#4E54C8',
      contrastText: '#fff',
    },
    secondary: {
      main: '#F67280', // 파스텔 핑크
      light: '#FFB7B2',
      dark: '#C06C84',
      contrastText: '#fff',
    },
    background: {
      default: '#F8F8FF', // 밝은 파스텔 배경
      paper: '#FFFFFF',
    },
    success: {
      main: '#43E97B',
      contrastText: '#fff',
    },
    info: {
      main: '#5BC0EB',
      contrastText: '#fff',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Noto Sans KR", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px 0 rgba(108,99,255,0.08)',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 4px 16px 0 rgba(108,99,255,0.16)',
            transform: 'translateY(-2px) scale(1.03)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 2px 16px 0 rgba(108,99,255,0.07)',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 6px 24px 0 rgba(108,99,255,0.13)',
            transform: 'translateY(-2px) scale(1.01)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          background: '#F3F3FA',
        },
        indicator: {
          height: 4,
          borderRadius: 4,
        },
      },
    },
  },
});

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={{
        body: { background: '#F8F8FF' },
        '.MuiPaper-root': { background: '#fff' },
      }} />
      <Router>
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
                  <ParentDashboard />
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
          {/* Child Routes */}
          <Route
            path="/child"
            element={
              user?.role === 'child' ? (
                <>
                  <Navigation user={user} onLogout={handleLogout} />
                  <ChildDashboard />
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
          import BadgePage from './pages/BadgePage'; // 상단에 추가

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
