import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useMfaChallenge } from '../../features/auth/hooks';

export const MfaVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const tempToken = (location.state as any)?.tempToken;
  const userEmail = (location.state as any)?.email;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mfaMutation = useMfaChallenge();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.trim().length < 6) {
      setError('Please enter a valid 6-digit authentication code');
      return;
    }
    if (!tempToken) {
      setError('Session expired. Please sign in again.');
      return;
    }
    setError(null);

    try {
      const result = await mfaMutation.mutateAsync({
        tempToken,
        code: code.trim(),
      });

      if (result.user.role === 'SUPER_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (result.user.role === 'RECRUITER') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/applicant/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Invalid verification code. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-surface-primary">
      <Card className="w-full max-w-md space-y-6 shadow-md border-border-default">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Two-Factor Verification</h2>
          <p className="text-sm text-text-secondary">
            {userEmail ? (
              <>Enter the 6-digit code generated for <span className="font-medium text-text-primary">{userEmail}</span>.</>
            ) : (
              'Enter the 6-digit code from your authenticator app.'
            )}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700 flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {!tempToken ? (
          <div className="text-center space-y-4">
            <p className="text-xs text-text-muted">
              No active verification session found. Please sign in first.
            </p>
            <Link
              to="/auth/login"
              className="inline-block text-xs font-semibold text-brand-primary hover:underline"
            >
              Go to Sign In &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              id="mfaCode"
              label="Verification Code (6-digit)"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-xl tracking-widest font-mono font-bold"
              required
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full h-10 font-semibold"
              disabled={mfaMutation.isPending || code.length < 6}
            >
              {mfaMutation.isPending ? 'Verifying...' : 'Verify & Continue'}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/auth/login"
                className="text-xs font-medium text-text-secondary hover:text-text-primary hover:underline"
              >
                &larr; Cancel and return to sign in
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default MfaVerificationPage;
