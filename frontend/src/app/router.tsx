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
import ApplicantProfilePage from '../pages/applicant/ApplicantProfilePage';
import JobSearchPage from '../pages/applicant/JobSearchPage';
import JobDetailPage from '../pages/applicant/JobDetailPage';
import CompanyDirectoryPage from '../pages/applicant/CompanyDirectoryPage';
import CompanyPublicProfilePage from '../pages/applicant/CompanyPublicProfilePage';
import RecruiterPipelinePage from '../pages/recruiter/RecruiterPipelinePage';
import RecruiterJobsPage from '../pages/recruiter/RecruiterJobsPage';
import JobCreationWizardPage from '../pages/recruiter/JobCreationWizardPage';
import TalentPoolPage from '../pages/recruiter/TalentPoolPage';
import CompanyAnalyticsPage from '../pages/recruiter/CompanyAnalyticsPage';
import RecruiterTeamPage from '../pages/recruiter/RecruiterTeamPage';
import CompanyProfilePage from '../pages/recruiter/CompanyProfilePage';
import AcceptInvitePage from '../pages/auth/AcceptInvitePage';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminCompaniesPage from '../pages/admin/AdminCompaniesPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminPlansPage from '../pages/admin/AdminPlansPage';
import AdminModerationPage from '../pages/admin/AdminModerationPage';
import { AdminConfigPage } from '../pages/admin/AdminConfigPage';
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
          <Route path="/jobs" element={<JobSearchPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/companies" element={<CompanyDirectoryPage />} />
          <Route path="/companies/:idOrSlug" element={<CompanyPublicProfilePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/mfa" element={<MfaVerificationPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
          <Route path="/invite/accept" element={<AcceptInvitePage />} />

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
          <Route
            path="/applicant/profile"
            element={
              <ProtectedRoute allowedRoles={['APPLICANT', 'SUPER_ADMIN']}>
                <ApplicantProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Protected Recruiter Routes */}
          <Route
            path="/recruiter"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <RecruiterJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/dashboard"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <RecruiterJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <RecruiterJobsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/new"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <JobCreationWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/jobs/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <JobCreationWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/pipeline"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <RecruiterPipelinePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/talent-pool"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <TalentPoolPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/analytics"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <CompanyAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/team"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <RecruiterTeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recruiter/company-profile"
            element={
              <ProtectedRoute allowedRoles={['RECRUITER', 'SUPER_ADMIN']}>
                <CompanyProfilePage />
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
          <Route
            path="/admin/config"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <AdminConfigPage />
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
