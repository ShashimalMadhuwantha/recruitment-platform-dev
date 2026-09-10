import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/home/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import ApplicantDashboardPage from '../pages/applicant/ApplicantDashboardPage';
import RecruiterPipelinePage from '../pages/recruiter/RecruiterPipelinePage';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import Header from '../components/shared/Header';
import { useAuth } from './providers';

export const AppRouter: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      <Header userRole={user?.role} userEmail={user?.email} onLogout={logout} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<LoginPage />} />
          <Route path="/applicant" element={<ApplicantDashboardPage />} />
          <Route path="/recruiter" element={<RecruiterPipelinePage />} />
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AppRouter;
