import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PopupProvider } from './context/PopupContext';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CommandPalette from './components/CommandPalette';
import BottomNav from './components/BottomNav';
import Login from './pages/Login';
import CommitteesList from './pages/CommitteesList';
import CommitteeCreate from './pages/CommitteeCreate';
import CommitteeDetail from './pages/CommitteeDetail';
import CommitteeEdit from './pages/CommitteeEdit';
import MembersList from './pages/MembersList';
import SchedulePayments from './pages/SchedulePayments';
import MemberDashboard from './pages/MemberDashboard';
import MemberCommittee from './pages/MemberCommittee';
import PrintView from './pages/PrintView';
import ProfileSettings from './pages/ProfileSettings';
import Reminders from './pages/Reminders';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'member') {
      return <Navigate to="/member/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global shortcut: ⌘K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Wait for session verification if token exists but user isn't loaded yet
  if (loading && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">Restoring session...</span>
        </div>
      </div>
    );
  }

  const isLoginPage = location.pathname === '/login';
  const isPrintPage = location.pathname.includes('/print');

  if (!user || isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to={user.role === 'member' ? "/member/dashboard" : "/"} replace /> : <Login />} 
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex font-sans selection:bg-orange-500 selection:text-white">
      {/* Multi-Section Executive Sidebar (Desktop Fixed + Mobile Sliding Drawer) */}
      {!isPrintPage && (
        <Sidebar 
          mobileOpen={mobileSidebarOpen} 
          onCloseMobile={() => setMobileSidebarOpen(false)} 
          onOpenSearch={() => setSearchOpen(true)} 
        />
      )}

      {/* Main Workspace (Header + Content + Mobile Bottom Nav) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-24 md:pb-0">
        {!isPrintPage && (
          <Header 
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)} 
            onOpenSearch={() => setSearchOpen(true)} 
          />
        )}

        <main key={location.pathname} className="flex-1 overflow-x-hidden animate-page-enter">
          <Routes>
            {/* Admin Routes */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CommitteesList />
              </ProtectedRoute>
            } />

            <Route path="/committees/create" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CommitteeCreate />
              </ProtectedRoute>
            } />

            <Route path="/committees/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CommitteeDetail />
              </ProtectedRoute>
            } />

            <Route path="/committees/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CommitteeEdit />
              </ProtectedRoute>
            } />

            <Route path="/committees/:id/print" element={
              <ProtectedRoute allowedRoles={['admin', 'member']}>
                <PrintView />
              </ProtectedRoute>
            } />

            <Route path="/members" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MembersList />
              </ProtectedRoute>
            } />

            <Route path="/schedules/:scheduleId/payments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SchedulePayments />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ProfileSettings />
              </ProtectedRoute>
            } />

            <Route path="/reminders" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Reminders />
              </ProtectedRoute>
            } />

            {/* Member Portal Routes */}
            <Route path="/member/dashboard" element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberDashboard />
              </ProtectedRoute>
            } />

            <Route path="/member/committees/:id" element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberCommittee />
              </ProtectedRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Floating Bottom Bar */}
      {!isPrintPage && <BottomNav />}

      {/* Global Command Palette / Search Bar Modal */}
      <CommandPalette isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PopupProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </PopupProvider>
    </AuthProvider>
  );
}
