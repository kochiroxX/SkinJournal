import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import InputForm from './components/InputForm';
import DataTable from './components/DataTable';

const theme = createTheme({
  palette: {
    primary: {
      main: '#e91e63',    // ピンク系（肌・美容テーマ）
      light: '#f8bbd0',
      dark: '#ad1457',
      contrastText: '#fff',
    },
    secondary: {
      main: '#7986cb',
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    fontFamily: [
      '"Noto Sans JP"',
      '"Hiragino Kaku Gothic ProN"',
      '"Meiryo"',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid',
          borderColor: '#f0f0f0',
          borderRadius: 12,
        },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/input" element={<InputForm />} />
            <Route path="/data" element={<DataTable />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  );
}
