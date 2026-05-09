import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CountdownTimer from './CountdownTimer';
import useCountdown from '../../hooks/useCountdown';

// Mock the hook
vi.mock('../../hooks/useCountdown');

describe('CountdownTimer Component', () => {
  it('renders correctly when active', () => {
    useCountdown.mockReturnValue({
      days: 2,
      hours: 5,
      minutes: 30,
      seconds: 15,
      isExpired: false
    });

    render(<CountdownTimer targetDate="2026-06-11T12:00:00Z" />);
    
    expect(screen.getByText('Días')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('Hrs')).toBeInTheDocument();
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders expired state correctly', () => {
    useCountdown.mockReturnValue({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    });

    render(<CountdownTimer targetDate="2026-06-11T12:00:00Z" />);
    
    expect(screen.getByText('Pronósticos cerrados')).toBeInTheDocument();
    expect(screen.queryByText('Días')).not.toBeInTheDocument();
  });
});
