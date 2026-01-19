import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailInput, { validateEmail } from './EmailInput';

describe('EmailInput', () => {
  const mockOnChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnValidationChange.mockClear();
  });

  it('renders with label when provided', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        label="Email Address"
        id="email"
      />
    );

    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        label="Email"
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('accepts valid email input', async () => {
    const user = userEvent.setup();
    render(<EmailInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test@example.com');

    expect(mockOnChange).toHaveBeenLastCalledWith('test@example.com');
  });

  it('validates email on blur when validateOnBlur is true', async () => {
    const user = userEvent.setup();
    render(
      <EmailInput
        value="invalid-email"
        onChange={mockOnChange}
        validateOnBlur
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
    expect(mockOnValidationChange).toHaveBeenCalledWith(false);
  });

  it('does not validate on blur when validateOnBlur is false', async () => {
    render(
      <EmailInput
        value="invalid-email"
        onChange={mockOnChange}
        validateOnBlur={false}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });

  it('clears error when user types valid email after error', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <EmailInput
        value="invalid"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    rerender(
      <EmailInput
        value="valid@example.com"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    await user.type(input, 'm');

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenLastCalledWith(true);
    });
  });

  it('displays external error message when error prop is provided', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        error="Email is required"
        id="email"
      />
    );

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('prioritizes external error over internal validation error', () => {
    render(
      <EmailInput
        value="invalid"
        onChange={mockOnChange}
        error="Custom error message"
        id="email"
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.blur(input);

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        error="Email is required"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('shows placeholder text', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter email"
      />
    );

    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-class');
  });

  it('sets aria-invalid when error is present', () => {
    render(
      <EmailInput
        value=""
        onChange={mockOnChange}
        error="Error"
        id="email"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('has correct autocomplete attribute', () => {
    render(<EmailInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });

  it('has type email', () => {
    render(<EmailInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });
});

describe('validateEmail', () => {
  it('returns true for valid emails', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.org')).toBe(true);
    expect(validateEmail('user+tag@example.co.uk')).toBe(true);
    expect(validateEmail('a@b.co')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('missing@')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });

  it('returns true for empty string', () => {
    expect(validateEmail('')).toBe(true);
  });
});
