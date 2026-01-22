import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { VenuesPage } from './pages/Venues';
import { StaffPage } from './pages/Staff';
import { ExportsPage } from './pages/Exports';
import { Login } from './pages/Login';

function ProtectedRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="venues" element={isAdmin ? <VenuesPage /> : <Navigate to="/" replace />} />
        <Route path="staff" element={isAdmin ? <StaffPage /> : <Navigate to="/" replace />} />
        <Route path="exports" element={<ExportsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ProtectedRoutes />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
