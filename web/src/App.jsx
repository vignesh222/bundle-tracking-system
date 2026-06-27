import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Styles from './pages/Styles';
import Bundles from './pages/Bundles';
import StockTransfer from './pages/StockTransfer';
import QRCodes from './pages/QRCodes';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function AuthRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthRedirect />} />
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="styles" element={<Styles />} />
            <Route path="bundles" element={<Bundles />} />
            <Route path="stock" element={<StockTransfer />} />
            <Route path="qrcodes" element={<QRCodes />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
