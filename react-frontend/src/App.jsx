import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<Login />} />

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
                <ProtectedRoute allowedRoles={['member', 'admin']}>
                  <MemberDashboard />
                </ProtectedRoute>
              } />

              <Route path="/member/committees/:id" element={
                <ProtectedRoute allowedRoles={['member', 'admin']}>
                  <MemberCommittee />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
