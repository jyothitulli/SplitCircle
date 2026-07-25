import { Route, Routes } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import HomePage from '../pages/Home';
import { LoginPage } from '../pages/auth/Login';
import { RegisterPage } from '../pages/auth/Register';
import { NotFoundPage } from '../pages/NotFound';
import { ProtectedRoute } from './ProtectedRoute';

// Lazy-load all protected pages for better initial load performance
const DashboardPage = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.DashboardPage })));
const CirclesPage = lazy(() => import('../pages/Circles').then(m => ({ default: m.CirclesPage })));
const ExpensesPage = lazy(() => import('../pages/Expenses').then(m => ({ default: m.ExpensesPage })));
const BalancesPage = lazy(() => import('../pages/Balances').then(m => ({ default: m.BalancesPage })));
const SettlementsPage = lazy(() => import('../pages/Settlements').then(m => ({ default: m.SettlementsPage })));
const ChoresPage = lazy(() => import('../pages/Chores').then(m => ({ default: m.ChoresPage })));
const FairnessPage = lazy(() => import('../pages/Fairness').then(m => ({ default: m.FairnessPage })));
const OCRUploadPage = lazy(() => import('../pages/OCRUpload').then(m => ({ default: m.OCRUploadPage })));
const VoiceExpensePage = lazy(() => import('../pages/VoiceExpense').then(m => ({ default: m.VoiceExpensePage })));
const AIInsightsPage = lazy(() => import('../pages/AIInsights').then(m => ({ default: m.AIInsightsPage })));

function LazyPage({ children }) {
  return (
    <Suspense fallback={
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary-500" />
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
}

function ProtectedPage({ children }) {
  return <ProtectedRoute><LazyPage>{children}</LazyPage></ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
      <Route path="/circles" element={<ProtectedPage><CirclesPage /></ProtectedPage>} />
      <Route path="/expenses" element={<ProtectedPage><ExpensesPage /></ProtectedPage>} />
      <Route path="/balances" element={<ProtectedPage><BalancesPage /></ProtectedPage>} />
      <Route path="/settlements" element={<ProtectedPage><SettlementsPage /></ProtectedPage>} />
      <Route path="/chores" element={<ProtectedPage><ChoresPage /></ProtectedPage>} />
      <Route path="/fairness" element={<ProtectedPage><FairnessPage /></ProtectedPage>} />
      <Route path="/ocr" element={<ProtectedPage><OCRUploadPage /></ProtectedPage>} />
      <Route path="/voice" element={<ProtectedPage><VoiceExpensePage /></ProtectedPage>} />
      <Route path="/insights" element={<ProtectedPage><AIInsightsPage /></ProtectedPage>} />
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
