import { createTheme } from '@mui/material/styles';

export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#FFD600',
      contrastText: '#222',
    },
    secondary: {
      main: '#FFB300',
      contrastText: '#222',
    },
    background: {
      default: '#FFFBEA',
      paper: '#fff',
    },
    text: {
      primary: '#222',
      secondary: '#555',
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
    fontFamily: 'Noto Sans KR, Roboto, Helvetica, Arial, sans-serif',
    h4: {
      fontWeight: 900,
      letterSpacing: '-1px',
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.5px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
          backgroundColor: '#FFD600',
          color: '#222',
          boxShadow: '0 2px 8px 0 rgba(255,214,0,0.08)',
          '&:hover': {
            backgroundColor: '#FFB300',
            color: '#222',
            boxShadow: '0 4px 16px 0 rgba(255,179,0,0.16)',
            transform: 'translateY(-2px) scale(1.03)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          boxShadow: '0 2px 16px 0 rgba(255,214,0,0.07)',
          border: '1.5px solid #FFE066',
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
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '1rem',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
}); 