/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base Palette (per frontend design skill)
        'brand-900': '#1B2A4A',
        'brand-600': '#2F4B8C',
        'brand-100': '#E4E9F5',
        surface: '#FFFFFF',
        'surface-muted': '#F6F7FA',
        'border-default': '#DFE3EA',
        'text-primary': '#1B2330',
        'text-secondary': '#5B6472',
        'text-muted': '#8B93A1',

        // ATS Score Color Bands
        'score-high': '#1E7A4C',
        'score-high-bg': '#E3F5EA',
        'score-mid': '#A5690B',
        'score-mid-bg': '#FBF0DD',
        'score-low': '#B3423A',
        'score-low-bg': '#FBE9E7',

        // Role Accents
        'role-applicant': '#2F4B8C',
        'role-recruiter': '#0F766E',
        'role-admin': '#3F4A5C',

        // Semantic States
        success: '#1E7A4C',
        warning: '#A5690B',
        danger: '#B3423A',
        info: '#2F4B8C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        lg: '8px',
      },
    },
  },
  plugins: [],
};
