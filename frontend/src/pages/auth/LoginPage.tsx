import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { OAuthButtons } from '../../components/ui/OAuthButtons';
import { useLogin } from '../../features/auth/hooks';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'APPLICANT' | 'RECRUITER'>('APPLICANT');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const navigate = useNavigate();
  const location = useLocation();
  const loginMutation = useLogin();

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setErrors({});

    try {
      const response = await loginMutation.mutateAsync({ email, password });
      if (response.requiresMfa && response.tempToken) {
        navigate('/auth/mfa', {
          state: { tempToken: response.tempToken, email },
        });
        return;
      }

      // Check if there was a redirect location stored
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (response.user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (response.user.role === 'RECRUITER') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/applicant/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Login failed. Please verify your credentials.';
      setErrors({ general: msg });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-surface-primary">
      <Card className="w-full max-w-md space-y-6 shadow-md border-border-default">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Sign In to RecruitATS</h2>
          <p className="text-sm text-text-secondary">
            Welcome back! Choose your account type to sign in.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-muted rounded-lg border border-border-default">
          <button
            type="button"
            onClick={() => setRole('APPLICANT')}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              role === 'APPLICANT'
                ? 'bg-surface text-brand-primary shadow-sm border border-border-default'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Job Seeker / Applicant
          </button>
          <button
            type="button"
            onClick={() => setRole('RECRUITER')}
            className={`py-2 text-xs font-semibold rounded-md transition-all ${
              role === 'RECRUITER'
                ? 'bg-surface text-brand-primary shadow-sm border border-border-default'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Employer / Recruiter
          </button>
        </div>

        {/* General Error Alert */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errors.general}</span>
          </div>
        )}

        {/* OAuth Buttons */}
        <OAuthButtons role={role} />

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border-default"></div>
          <span className="flex-shrink mx-4 text-xs font-medium text-text-muted uppercase tracking-wider">
            Or continue with email
          </span>
          <div className="flex-grow border-t border-border-default"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="email"
            label="Email Address"
            type="email"
            placeholder={role === 'APPLICANT' ? 'applicant@example.com' : 'recruiter@company.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <div className="space-y-1">
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="current-password"
            />
            <div className="flex justify-end pt-0.5">
              <Link
                to="/auth/forgot-password"
                className="text-xs font-medium text-brand-primary hover:text-brand-primary-hover hover:underline"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-10 font-semibold"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing In...' : `Sign In as ${role === 'APPLICANT' ? 'Applicant' : 'Recruiter'}`}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-border-default">
          <p className="text-xs text-text-secondary">
            Don't have an account yet?{' '}
            <Link
              to={`/auth/register?role=${role}`}
              className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
