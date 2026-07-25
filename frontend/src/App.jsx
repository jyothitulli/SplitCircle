import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { queryClient } from './lib/queryClient';
import { InstallPWABanner } from './components/ui/InstallPWA';
import AppRoutes from './routes/AppRoutes';

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
            <InstallPWABanner />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3200,
                style: {
                  background: 'rgb(var(--surface))',
                  color: 'rgb(var(--ink))',
                  border: '1px solid rgb(var(--border))',
                  borderRadius: '16px',
                  boxShadow: '0 24px 70px -35px rgb(var(--shadow-color) / 0.4)',
                  fontSize: '0.875rem',
                  padding: '12px 16px',
                },
                success: { iconTheme: { primary: 'rgb(var(--primary-500))', secondary: '#ffffff' } },
                error: { iconTheme: { primary: 'rgb(var(--danger-500))', secondary: '#ffffff' } },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
