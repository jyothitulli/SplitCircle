import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/Login';
import { RegisterPage } from '../pages/auth/Register';
import { DashboardPage } from '../pages/Dashboard';
import { CirclesPage } from '../pages/Circles';
import { ExpensesPage } from '../pages/Expenses';
import { BalancesPage } from '../pages/Balances';
import { SettlementsPage } from '../pages/Settlements';
import { ChoresPage } from '../pages/Chores';
import { FairnessPage } from '../pages/Fairness';
import { OCRUploadPage } from '../pages/OCRUpload';
import { VoiceExpensePage } from '../pages/VoiceExpense';
import { AIInsightsPage } from '../pages/AIInsights';
import { ProtectedRoute } from './ProtectedRoute';

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<P><DashboardPage /></P>} />
      <Route path="/circles" element={<P><CirclesPage /></P>} />
      <Route path="/expenses" element={<P><ExpensesPage /></P>} />
      <Route path="/balances" element={<P><BalancesPage /></P>} />
      <Route path="/settlements" element={<P><SettlementsPage /></P>} />
      <Route path="/chores" element={<P><ChoresPage /></P>} />
      <Route path="/fairness" element={<P><FairnessPage /></P>} />
      <Route path="/ocr" element={<P><OCRUploadPage /></P>} />
      <Route path="/voice" element={<P><VoiceExpensePage /></P>} />
      <Route path="/insights" element={<P><AIInsightsPage /></P>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
