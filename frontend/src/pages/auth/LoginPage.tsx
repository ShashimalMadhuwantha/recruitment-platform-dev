import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../app/providers';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'APPLICANT' | 'RECRUITER' | 'SUPER_ADMIN'>('APPLICANT');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleDemoLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('mock-jwt-token-epic-0', {
      id: 'demo-user-id',
      email: email || `${role.toLowerCase()}@example.com`,
      role,
      status: 'ACTIVE',
    });
    if (role === 'SUPER_ADMIN') navigate('/admin');
    else if (role === 'RECRUITER') navigate('/recruiter');
    else navigate('/applicant');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-brand-900">Sign in to your account</h2>
          <p className="text-xs text-text-secondary">Select your role to explore role-specific views</p>
        </div>

        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 bg-surface-muted rounded-lg border border-border-default">
            {(['APPLICANT', 'RECRUITER', 'SUPER_ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-1.5 text-xs font-medium rounded-md transition-all ${
                  role === r
                    ? 'bg-surface text-brand-600 shadow-sm border border-border-default'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {r === 'SUPER_ADMIN' ? 'Admin' : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <FormField
            id="email"
            label="Email Address"
            type="email"
            placeholder={`${role.toLowerCase()}@example.com`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" className="w-full">
            Sign In as {role.replace('_', ' ')}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
