import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/home/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import MfaVerificationPage from '../pages/auth/MfaVerificationPage';
import OAuthCallbackPage from '../pages/auth/OAuthCallbackPage';
import ApplicantDashboardPage from '../pages/applicant/ApplicantDashboardPage';
import RecruiterPipelinePage from '../pages/recruiter/RecruiterPipelinePage';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminCompaniesPage from '../pages/admin/AdminCompaniesPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminPlansPage from '../pages/admin/AdminPlansPage';
import AdminModerationPage from '../pages/admin/AdminModerationPage';
import Header from '../components/shared/Header';
import ImpersonationBanner from '../components/shared/ImpersonationBanner';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { useAuth } from './providers';

export const AppRouter: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <ImpersonationBanner />
      <Header userRole={user?.role} userEmail={user?.email} onLogout={logout} />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/mfa" element={<MfaVerificationPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />

          {/* Protected Applicant Routes */}
          <Route
            path="/applicant"
            element={
              <ProtectedRoute allowedRoles={['APPLICANT', 'SUPER_ADMIN']}>
                <ApplicantDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applicant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['APPLICANT', 'SUPER_ADMIN']}>
                <ApplicantDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Recruiter Routes */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <RecruiterPipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <RecruiterPipelinePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminCompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminPlansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/moderation"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminModerationPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AppRouter;
