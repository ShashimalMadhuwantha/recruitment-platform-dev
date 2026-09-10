import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useResetPassword } from '../../features/auth/hooks';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ token?: string; password?: string; confirm?: string; general?: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();
  const resetPasswordMutation = useResetPassword();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  const validate = () => {
    const errs: { token?: string; password?: string; confirm?: string } = {};
    if (!token.trim()) errs.token = 'Reset token is required';
    if (!password || password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setErrors({});

    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword: password });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 2500);
    } catch (err: any) {
      setErrors({
        general: err.response?.data?.error?.message || err.message || 'Failed to reset password. The token may be expired or invalid.',
      });
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-surface-primary">
      <Card className="w-full max-w-md space-y-6 shadow-md border-border-default">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Set New Password</h2>
          <p className="text-sm text-text-secondary">
            Enter your reset token and choose a secure new password.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-emerald-900">Password Reset Successful!</p>
            <p className="text-xs">Your password has been updated. Redirecting you to sign in...</p>
            <div className="pt-2">
              <Link
                to="/auth/login"
                className="text-xs font-semibold text-brand-primary hover:underline"
              >
                Click here if not redirected automatically
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 flex items-start space-x-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errors.general}</span>
              </div>
            )}

            <FormField
              id="token"
              label="Reset Token"
              placeholder="Paste your reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              error={errors.token}
              required
            />

            <FormField
              id="password"
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              helperText="Min. 8 characters"
              required
              autoComplete="new-password"
            />

            <FormField
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirm}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-10 font-semibold mt-2"
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Updating Password...' : 'Reset Password'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/auth/login"
                className="text-xs font-medium text-text-secondary hover:text-text-primary hover:underline"
              >
                &larr; Back to sign in
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
