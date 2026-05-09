import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ScoreInput from './ScoreInput';

describe('ScoreInput Component', () => {
  it('renders correctly with empty value', () => {
    const handleChange = vi.fn();
    render(<ScoreInput value="" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('renders correctly with numeric value', () => {
    const handleChange = vi.fn();
    render(<ScoreInput value={2} onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('2');
  });

  it('calls onChange with valid numeric input', () => {
    const handleChange = vi.fn();
    render(<ScoreInput value="" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: '3' } });
    expect(handleChange).toHaveBeenCalledWith(3);
  });

  it('does not call onChange for values > 99', () => {
    const handleChange = vi.fn();
    render(<ScoreInput value={9} onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: '100' } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('increments and decrements using arrow keys', () => {
    const handleChange = vi.fn();
    render(<ScoreInput value={5} onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(handleChange).toHaveBeenCalledWith(6);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(handleChange).toHaveBeenCalledWith(4);
  });
});
