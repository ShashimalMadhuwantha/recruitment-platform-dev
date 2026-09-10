import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from '../../src/pages/auth/LoginPage';
import { RegisterPage } from '../../src/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../../src/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../../src/pages/auth/ResetPasswordPage';
import { ProtectedRoute } from '../../src/components/shared/ProtectedRoute';
import * as ProvidersModule from '../../src/app/providers';

const renderWithProviders = (ui: React.ReactElement, initialEntries = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Frontend Auth Flow & Pages', () => {
  describe('LoginPage', () => {
    it('renders login form with role switcher and input fields', () => {
      renderWithProviders(<LoginPage />);

      expect(screen.getByText('Sign In to RecruitATS')).toBeInTheDocument();
      expect(screen.getByText('Job Seeker / Applicant')).toBeInTheDocument();
      expect(screen.getByText('Employer / Recruiter')).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('switches role tabs on click', () => {
      renderWithProviders(<LoginPage />);

      const recruiterTab = screen.getByText('Employer / Recruiter');
      fireEvent.click(recruiterTab);

      expect(screen.getByRole('button', { name: /Sign In as Recruiter/i })).toBeInTheDocument();
    });
  });

  describe('RegisterPage', () => {
    it('renders applicant registration fields by default', () => {
      renderWithProviders(<RegisterPage />);

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Professional Headline/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Company Name/i)).not.toBeInTheDocument();
    });

    it('switches to recruiter registration fields when recruiter tab is clicked', () => {
      renderWithProviders(<RegisterPage />);

      const recruiterTab = screen.getByText('Employer / Recruiter');
      fireEvent.click(recruiterTab);

      expect(screen.getByLabelText(/Company Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Recruiting Role/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Professional Headline/i)).not.toBeInTheDocument();
    });
  });

  describe('ForgotPasswordPage & ResetPasswordPage', () => {
    it('renders forgot password input form', () => {
      renderWithProviders(<ForgotPasswordPage />);

      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/Account Email Address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
    });

    it('renders reset password form with token and password fields', () => {
      renderWithProviders(<ResetPasswordPage />, ['/auth/reset-password?token=sample-token-123']);

      expect(screen.getByText('Set New Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reset Token/i)).toHaveValue('sample-token-123');
      expect(screen.getByLabelText(/^New Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    });
  });

  describe('ProtectedRoute', () => {
    it('redirects unauthenticated users to /auth/login', () => {
      vi.spyOn(ProvidersModule, 'useAuth').mockReturnValue({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={['APPLICANT']}>
                <div>Protected Applicant Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/auth/login" element={<div>Login Page Target</div>} />
        </Routes>,
        ['/protected']
      );

      expect(screen.getByText('Login Page Target')).toBeInTheDocument();
      expect(screen.queryByText('Protected Applicant Content')).not.toBeInTheDocument();
    });

    it('allows access when user has the required role', () => {
      vi.spyOn(ProvidersModule, 'useAuth').mockReturnValue({
        user: {
          id: 'user-123',
          email: 'applicant@test.com',
          role: 'APPLICANT',
          status: 'ACTIVE',
          mfaEnabled: false,
        },
        accessToken: 'valid-token',
        refreshToken: 'valid-refresh-token',
        isAuthenticated: true,
        isLoading: false,
        login: vi.fn(),
        logout: vi.fn(),
        updateUser: vi.fn(),
      });

      renderWithProviders(
        <Routes>
          <Route
            path="/applicant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['APPLICANT', 'SUPER_ADMIN']}>
                <div>Applicant Secret Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>,
        ['/applicant/dashboard']
      );

      expect(screen.getByText('Applicant Secret Dashboard')).toBeInTheDocument();
    });
  });
});
