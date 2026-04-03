import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BoardProvider } from './context/BoardContext';
import { Board } from './components/board/Board';

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  palette: {
    primary: { main: '#3b82f6' },
    secondary: { main: '#6366f1' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    success: { main: '#10b981' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem' },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BoardProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
          <Board />
        </div>
      </BoardProvider>
    </ThemeProvider>
  );
}

export default App;
