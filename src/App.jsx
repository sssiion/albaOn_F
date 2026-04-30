import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './lib/auth';
import Login        from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import Dashboard    from './pages/Dashboard';
import StoreDetail  from './pages/StoreDetail';  // 추가

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={<Login />} />
        <Route path="/auth/callback"  element={<AuthCallback />} />
        <Route path="/auth/error"     element={<div>로그인 실패</div>} />
        <Route path="/dashboard"      element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/store/:storeId" element={<PrivateRoute><StoreDetail /></PrivateRoute>} />
        <Route path="*"               element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}