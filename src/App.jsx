// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import CardGeneration from './pages/dashboard/CardGeneration';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/*" element={
              <ProtectedRoute>
                <Dashboard /> 
              </ProtectedRoute>
            } />
             <Route path="/card-generation" element={
              <ProtectedRoute>
                <CardGeneration />
              </ProtectedRoute>
            } />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Small delay to ensure state is settled after loading completes
      const timer = setTimeout(() => {
        setAuthChecked(true);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  console.log('🛡️ ProtectedRoute:');
  console.log('   - Loading:', loading);
  console.log('   - AuthChecked:', authChecked);
  console.log('   - User:', user);

  // Show loading while checking auth
  if (loading || !authChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex items-center justify-center">
        <div className="text-white text-xl">Verifying session...</div>
      </div>
    );
  }

  // If we have a user, render the protected content
  if (user) {
    return children;
  }

  // If no user after auth check, redirect to login
  console.log('🚫 No user after auth check, redirecting to login');
  return <Navigate to="/login" replace />;
};

export default App;