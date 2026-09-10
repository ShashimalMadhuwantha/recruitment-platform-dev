import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { OAuthButtons } from '../../components/ui/OAuthButtons';
import { useRegisterApplicant, useRegisterRecruiter } from '../../features/auth/hooks';
import { RecruiterSubRole } from '@recruitment-platform/shared';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'RECRUITER' ? 'RECRUITER' : 'APPLICANT';
  const [role, setRole] = useState<'APPLICANT' | 'RECRUITER'>(initialRole);

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Applicant fields
  const [phone, setPhone] = useState('');
  const [headline, setHeadline] = useState('');

  // Recruiter fields
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('');
  const [companySize, setCompanySize] = useState('11-50');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [subRole, setSubRole] = useState<RecruiterSubRole>('COMPANY_ADMIN');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const registerApplicant = useRegisterApplicant();
  const registerRecruiter = useRegisterRecruiter();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'RECRUITER') setRole('RECRUITER');
    else if (roleParam === 'APPLICANT') setRole('APPLICANT');
  }, [searchParams]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!email || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Valid email is required';
    if (!password || password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';

    if (role === 'RECRUITER') {
      if (!companyName.trim()) errs.companyName = 'Company name is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setErrors({});

    try {
      if (role === 'APPLICANT') {
        await registerApplicant.mutateAsync({
          firstName,
          lastName,
          email,
          password,
          phone: phone || undefined,
          headline: headline || undefined,
        });
        navigate('/applicant/dashboard', { replace: true });
      } else {
        await registerRecruiter.mutateAsync({
          firstName,
          lastName,
          email,
          password,
          companyName,
          companyIndustry: companyIndustry || undefined,
          companySize: companySize || undefined,
          companyWebsite: companyWebsite || undefined,
          subRole,
        });
        navigate('/recruiter/dashboard', { replace: true });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Registration failed. Please try again.';
      setErrors({ general: msg });
    }
  };

  const isPending = registerApplicant.isPending || registerRecruiter.isPending;

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-surface-primary">
      <Card className="w-full max-w-lg space-y-6 shadow-md border-border-default">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary mb-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary tracking-tight">Create your account</h2>
          <p className="text-sm text-text-secondary">
            Join RecruitATS to match with opportunities or hire top talent.
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
            Or register with email
          </span>
          <div className="flex-grow border-t border-border-default"></div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="firstName"
              label="First Name"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={errors.firstName}
              required
            />
            <FormField
              id="lastName"
              label="Last Name"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={errors.lastName}
              required
            />
          </div>

          <FormField
            id="email"
            label={role === 'RECRUITER' ? 'Work Email' : 'Email Address'}
            type="email"
            placeholder={role === 'APPLICANT' ? 'jane.doe@example.com' : 'jane.doe@company.com'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
            autoComplete="email"
          />

          {/* Applicant Specific Fields */}
          {role === 'APPLICANT' && (
            <>
              <FormField
                id="headline"
                label="Professional Headline"
                placeholder="e.g. Senior Frontend Engineer | TypeScript & React"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                helperText="A brief summary of your expertise"
              />
              <FormField
                id="phone"
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          {/* Recruiter Specific Fields */}
          {role === 'RECRUITER' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  id="companyName"
                  label="Company Name"
                  placeholder="Acme Corp"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  error={errors.companyName}
                  required
                />
                <FormField
                  id="companyIndustry"
                  label="Industry"
                  placeholder="e.g. Software, Finance"
                  value={companyIndustry}
                  onChange={(e) => setCompanyIndustry(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label htmlFor="companySize" className="block text-xs font-medium text-text-secondary">
                    Company Size
                  </label>
                  <select
                    id="companySize"
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full h-10 px-3.5 bg-surface rounded-lg border border-border-default text-sm text-text-primary focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                  >
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-left">
                  <label htmlFor="subRole" className="block text-xs font-medium text-text-secondary">
                    Recruiting Role
                  </label>
                  <select
                    id="subRole"
                    value={subRole}
                    onChange={(e) => setSubRole(e.target.value as RecruiterSubRole)}
                    className="w-full h-10 px-3.5 bg-surface rounded-lg border border-border-default text-sm text-text-primary focus:border-brand-600 focus:ring-1 focus:ring-brand-600 outline-none"
                  >
                    <option value="COMPANY_ADMIN">Company Administrator</option>
                    <option value="HIRING_MANAGER">Hiring Manager</option>
                    <option value="INTERVIEWER">Interviewer</option>
                  </select>
                </div>
              </div>

              <FormField
                id="companyWebsite"
                label="Company Website (Optional)"
                type="url"
                placeholder="https://acme.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />
            </>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
              helperText="Min. 8 characters"
              autoComplete="new-password"
            />
            <FormField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-10 font-semibold mt-2"
            disabled={isPending}
          >
            {isPending ? 'Creating Account...' : `Register as ${role === 'APPLICANT' ? 'Applicant' : 'Recruiter'}`}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-border-default">
          <p className="text-xs text-text-secondary">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="font-semibold text-brand-primary hover:text-brand-primary-hover hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
