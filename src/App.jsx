// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './components/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import CardGeneration from './pages/dashboard/CardGeneration';
import NotFound from './components/errors/NotFound';

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
            <Route path='*' element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Protected Route Component
// Protected Route Component
// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  // Check if we're currently on the login page
  const isLoginPage = window.location.pathname === '/login';
  
  console.log('🔥 PROTECTED ROUTE DEBUG 🔥');
  console.log('1. Current path:', window.location.pathname);
  console.log('2. Is login page?', isLoginPage);
  console.log('3. User exists?', !!user);
  console.log('4. User object:', user);
  console.log('5. Loading?', loading);
  console.log('-----------------------------------');
  
  // If we're on login page, show it without ANY checks
  if (isLoginPage) {
    console.log('✅ ON LOGIN PAGE - RETURNING LOGIN COMPONENT');
    return children;
  }
  
  // Only for non-login pages:
  if (loading) {
    console.log('⏳ LOADING - Showing loading screen');
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }
  
  if (user) {
    console.log('✅ AUTHENTICATED - Showing protected content');
    return children;
  }
  
  console.log('🚫 NO USER - Redirecting to /login');
  return <Navigate to="/login" replace />;
};


export default App;