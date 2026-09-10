import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreBadge, getScoreBand } from '../../src/components/ui/ScoreBadge';

describe('ScoreBadge Component Unit Tests', () => {
  it('correctly categorizes score bands and labels', () => {
    expect(getScoreBand(95).label).toBe('Strong match');
    expect(getScoreBand(95).band).toBe('high');

    expect(getScoreBand(72).label).toBe('Partial match');
    expect(getScoreBand(72).band).toBe('mid');

    expect(getScoreBand(35).label).toBe('Weak match');
    expect(getScoreBand(35).band).toBe('low');
  });

  it('renders high score badge with correct percentage and label', () => {
    render(<ScoreBadge score={88} size="md" />);

    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('Strong match')).toBeInTheDocument();

    const badge = screen.getByTestId('score-badge');
    expect(badge).toHaveClass('text-score-high');
    expect(badge).toHaveClass('bg-score-high-bg');
  });

  it('renders mid score badge with correct label and color classes', () => {
    render(<ScoreBadge score={65} size="sm" />);

    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('Partial match')).toBeInTheDocument();

    const badge = screen.getByTestId('score-badge');
    expect(badge).toHaveClass('text-score-mid');
    expect(badge).toHaveClass('bg-score-mid-bg');
  });

  it('renders weak score badge with progress bar when requested', () => {
    render(<ScoreBadge score={42} size="lg" showProgressBar={true} />);

    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('Weak match')).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '42');
  });
});
