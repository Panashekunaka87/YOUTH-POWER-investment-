import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Tasks } from './pages/Tasks';
import { Team } from './pages/Team';
import { Account } from './pages/Account';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!isAdmin) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/team" element={<Team />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
