import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  ShieldCheck,
  Briefcase,
  User,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/providers';
import { companyTeamApi } from '../../features/company-team/api';
import type { VerifyInvitationResponseDto, RecruiterSubRole } from '../../features/company-team/types';

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [invitationInfo, setInvitationInfo] = useState<VerifyInvitationResponseDto | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setVerificationError('No invitation token provided in the URL.');
      setIsLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const data = await companyTeamApi.verifyInvitationToken(token);
        setInvitationInfo(data);
      } catch (err: any) {
        setVerificationError(
          err.response?.data?.message || err.message || 'Invitation link is invalid or has expired.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    verify();
  }, [token]);

  const getSubRoleBadge = (subRole?: RecruiterSubRole) => {
    switch (subRole) {
      case 'COMPANY_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Company Administrator</span>
          </span>
        );
      case 'HIRING_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Hiring Manager</span>
          </span>
        );
      case 'INTERVIEWER':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <User className="w-3.5 h-3.5" />
            <span>Interviewer</span>
          </span>
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!token) return;

    if (!firstName.trim() || !lastName.trim()) {
      setSubmitError('Please enter your first and last name.');
      return;
    }

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match. Please verify.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await companyTeamApi.acceptInvitation({
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      });

      // Login with issued token
      login(
        response.token,
        (response as any).refreshToken || response.token,
        response.user
      );

      navigate('/recruiter/dashboard', { replace: true });
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || err.message || 'Failed to complete invitation onboarding.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl border border-border-default p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
          <div className="w-10 h-10 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-text-primary">Verifying Invitation</h3>
            <p className="text-xs text-text-secondary">
              Validating security token and tenant credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (verificationError || !invitationInfo) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl border border-border-default p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-text-primary">
              Invitation Invalid or Expired
            </h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              {verificationError || 'This invitation link is no longer valid. It may have already been accepted or revoked by an administrator.'}
            </p>
          </div>
          <div className="pt-2">
            <Link to="/auth/login">
              <Button variant="primary" size="sm">
                Go to Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-surface rounded-2xl shadow-xl border border-border-default overflow-hidden">
        {/* Banner */}
        <div className="p-6 border-b border-border-default bg-gradient-to-r from-brand-600 to-indigo-700 text-white space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-100">
              Recruitment Team Invitation
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Join {invitationInfo.companyName}
          </h1>
          <p className="text-xs text-brand-100/90 leading-relaxed">
            You have been invited to collaborate with {invitationInfo.companyName} on their hiring platform.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {submitError}
            </div>
          )}

          {/* Invitation Details Summary Card */}
          <div className="p-4 rounded-xl bg-surface-muted/60 border border-border-default space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Assigned Sub-Role</span>
              {getSubRoleBadge(invitationInfo.subRole)}
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-border-default/60">
              <span className="text-text-muted">Invited Corporate Email</span>
              <span className="font-semibold text-text-primary">{invitationInfo.email}</span>
            </div>
          </div>

          {/* Account Creation Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="join-fname" className="block text-xs font-semibold text-text-primary">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="join-fname"
                  type="text"
                  required
                  placeholder="Sarah"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-10 px-3.5 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="join-lname" className="block text-xs font-semibold text-text-primary">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="join-lname"
                  type="text"
                  required
                  placeholder="Jenkins"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full h-10 px-3.5 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="join-pass" className="block text-xs font-semibold text-text-primary">
                Choose Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="join-pass"
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-3.5 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="join-confirm" className="block text-xs font-semibold text-text-primary">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="join-confirm"
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-3.5 bg-surface rounded-xl border border-border-default text-xs text-text-primary outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="w-full font-bold gap-2 justify-center shadow-xs"
            >
              <span>Accept Invitation & Join Team</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-[11px] text-text-muted text-center leading-snug">
            By clicking Accept, you agree to our Terms of Service and Privacy Policy. Your seat has been pre-allocated by {invitationInfo.companyName}.
          </p>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
