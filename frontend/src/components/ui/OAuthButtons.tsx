import React from 'react';
import { Button } from './Button';

export interface OAuthButtonsProps {
  role?: 'APPLICANT' | 'RECRUITER';
  onOAuthClick?: (provider: 'google' | 'linkedin') => void;
  className?: string;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  role = 'APPLICANT',
  onOAuthClick,
  className,
}) => {
  const handleOAuth = (provider: 'google' | 'linkedin') => {
    if (onOAuthClick) {
      onOAuthClick(provider);
    } else {
      // Direct to backend OAuth start endpoint
      window.location.href = `/api/v1/auth/${provider}?role=${role}`;
    }
  };

  return (
    <div className={`space-y-2.5 ${className || ''}`}>
      {/* Google Sign In Button */}
      <Button
        type="button"
        variant="secondary"
        className="w-full flex items-center justify-center gap-3 border-border-default text-text-primary hover:bg-surface-muted h-10 font-medium"
        onClick={() => handleOAuth('google')}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>Continue with Google</span>
      </Button>

      {/* LinkedIn Sign In Button */}
      <Button
        type="button"
        variant="secondary"
        className="w-full flex items-center justify-center gap-3 border-border-default text-text-primary hover:bg-surface-muted h-10 font-medium"
        onClick={() => handleOAuth('linkedin')}
      >
        <svg className="w-4 h-4 fill-[#0A66C2]" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
        <span>Continue with LinkedIn</span>
      </Button>
    </div>
  );
};

export default OAuthButtons;
