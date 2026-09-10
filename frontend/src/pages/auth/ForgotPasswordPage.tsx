import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useForgotPassword } from '../../features/auth/hooks';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const forgotPasswordMutation = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError(null);

    try {
      await forgotPasswordMutation.mutateAsync(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to send reset instructions');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-surface-primary">
      <Card className="w-full max-w-md space-y-6 shadow-md border-border-default">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Forgot Password</h2>
          <p className="text-sm text-text-secondary">
            Enter your email address and we'll send you instructions to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 space-y-2">
              <div className="flex items-center space-x-2 font-semibold text-emerald-900">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Reset Instructions Dispatched</span>
              </div>
              <p className="text-xs">
                If an account exists with <span className="font-semibold">{email}</span>, you will receive a password reset link shortly.
              </p>
            </div>

            <div className="pt-2 text-center space-y-2">
              <Link
                to={`/auth/reset-password?email=${encodeURIComponent(email)}`}
                className="inline-block text-xs font-semibold text-brand-primary hover:underline"
              >
                Already have a reset token? Enter it here &rarr;
              </Link>
              <div>
                <Link
                  to="/auth/login"
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  &larr; Back to sign in
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 flex items-start space-x-2">
                <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <FormField
              id="email"
              label="Account Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-10 font-semibold"
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending ? 'Sending Link...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
