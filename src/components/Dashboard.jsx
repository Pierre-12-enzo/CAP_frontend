// components/Dashboard.jsx - WITH REACT ROUTER DOM
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Overview from '../pages/dashboard/Overview';
import CardGeneration from '../pages/dashboard/CardGeneration';
import StudentManagement from '../pages/dashboard/StudentManagement';
import Profile from '../pages/dashboard/Profile';
import TemplateManager from '../pages/dashboard/TemplateManager';
import PermissionStudio from '../pages/dashboard/PermissionStudio';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  // Helper to check if a route is active
  const isActiveRoute = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Fixed Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white/95 backdrop-blur-xl shadow-2xl border-r border-emerald-200/30 transition-all duration-500 ease-in-out flex flex-col fixed h-screen z-50`}>

        {/* Logo Section */}
        <div className="relative z-10 p-4 border-b border-emerald-200/30 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-800 rounded-xl flex items-center justify-center shadow-xl shadow-emerald-500/30 transform hover:rotate-12 transition-transform duration-500">
                <i className="pi pi-id-card text-white text-sm"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">
                  CAP_mis
                </h1>
                <p className="text-sm text-emerald-600/80">Card System</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Using Links instead of buttons */}
        <div className="flex-1 px-3 py-4 space-y-2">
          <NavLinkItem
            icon="pi-chart-line"
            label="Dashboard"
            to="/dashboard"
            active={isActiveRoute('/dashboard')}
            sidebarOpen={sidebarOpen}
          />
          <NavLinkItem
            icon="pi-qrcode"
            label="Card Studio"
            to="/dashboard/card-studio"
            active={isActiveRoute('/dashboard/card-studio')}
            sidebarOpen={sidebarOpen}
          />
          <NavLinkItem
            icon="pi-id-card"
            label="Permission-studio"
            to="/dashboard/permissions"
            active={isActiveRoute('/dashboard/permissions')}
            sidebarOpen={sidebarOpen}
          />
          <NavLinkItem
            icon="pi-users"
            label="Students"
            to="/dashboard/students"
            active={isActiveRoute('/dashboard/students')}
            sidebarOpen={sidebarOpen}
          />
          <NavLinkItem
            icon="pi-image"
            label="Templates Manager"
            to="/dashboard/templates"
            active={isActiveRoute('/dashboard/templates')}
            sidebarOpen={sidebarOpen}
          />
          <NavLinkItem
            icon="pi-cog"
            label="Settings"
            to="/dashboard/settings"
            active={isActiveRoute('/dashboard/settings')}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-emerald-200/30 flex-shrink-0 space-y-3">
          {/* Support Links */}
          {sidebarOpen && (
            <div className="space-y-2">
              <SidebarLink
                icon="pi-question-circle"
                label="Help & Support"
              />
              <SidebarLink
                icon="pi-book"
                label="Documentation"
              />
            </div>
          )}

          {/* User Info */}
          {sidebarOpen ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/50">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-sm text-emerald-600 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-2 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <i className="pi pi-sign-out text-base"></i>
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.firstName?.charAt(0)}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              >
                <i className="pi pi-sign-out text-base"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-emerald-200/30">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <i className={`pi ${sidebarOpen ? 'pi-bars' : 'pi-arrow-right'} text-emerald-700 text-base`}></i>
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-800 bg-clip-text text-transparent">
                  {getPageTitle(location.pathname)}
                </h1>
                <p className="text-sm text-emerald-600/80 mt-1">
                  {getPageSubtitle(location.pathname)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <p className="text-base font-semibold text-gray-900">Hi, {user?.firstName}!</p>
                  <p className="text-sm text-emerald-600">
                    {new Date().toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center">
                  <i className="pi pi-verified text-white text-sm"></i>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <div className="w-full">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-200/30 overflow-hidden">
              <Routes>
                <Route path="/" element={<Overview />} />
                <Route path="/card-studio" element={<CardGeneration />} />
                <Route path='/templates' element={<TemplateManager />} />
                <Route path='/permissions' element={<PermissionStudio />} />
                <Route path="/students" element={<StudentManagement />} />
                <Route path="/settings" element={<Profile />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar Link Component
const SidebarLink = ({ icon, label }) => (
  <button className="w-full flex items-center space-x-2 p-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-lg transition-colors">
    <i className={`pi ${icon} text-base`}></i>
    <span className="font-medium">{label}</span>
  </button>
);

// Nav Link Item Component - Using Link instead of button
const NavLinkItem = ({ icon, label, to, active, sidebarOpen }) => (
  <Link
    to={to}
    className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors ${active
      ? 'bg-gradient-to-r from-emerald-600/10 to-green-700/10 text-emerald-700 border border-emerald-300/50'
      : 'text-gray-700 hover:bg-emerald-50/80 hover:text-emerald-600 border border-transparent'
      }`}
  >
    <i className={`pi ${icon} text-base ${active ? 'text-emerald-600' : 'text-gray-500'}`}></i>
    {sidebarOpen && (
      <span className={`font-semibold text-sm ${active ? 'text-emerald-700' : 'text-gray-700'}`}>
        {label}
      </span>
    )}
    {active && (
      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-1 h-4 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
    )}
  </Link>
);

// Updated helper functions to use pathname
const getPageTitle = (pathname) => {
  const titles = {
    '/dashboard': 'Dashboard',
    '/dashboard/card-studio': 'Card Studio',
    '/dashboard/templates': 'Template Manager',
    '/dashboard/students': 'Students',
    '/dashboard/permissions': 'Permission Studio',
    '/dashboard/settings': 'Settings'
  };
  return titles[pathname] || 'Dashboard';
};

const getPageSubtitle = (pathname) => {
  const subtitles = {
    '/dashboard': 'System overview and analytics',
    '/dashboard/card-studio': 'ID card design and generation',
    '/dashboard/permissions': 'Permission Management',
    '/dashboard/students': 'Manage student records',
    '/dashboard/settings': 'System configuration'
  };
  return subtitles[pathname] || 'Manage your operations';
};

export default Dashboard;