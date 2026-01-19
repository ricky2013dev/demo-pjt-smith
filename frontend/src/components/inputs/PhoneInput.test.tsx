import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhoneInput from './PhoneInput';

describe('PhoneInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label when provided', () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        label="Phone Number"
        id="phone"
      />
    );

    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        label="Phone Number"
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('formats phone number as user types', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PhoneInput value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, '1234567890');

    expect(mockOnChange).toHaveBeenLastCalledWith('123-456-7890');
  });

  it('formats partial phone numbers correctly', () => {
    render(<PhoneInput value="123" onChange={mockOnChange} />);
    expect(screen.getByDisplayValue('123')).toBeInTheDocument();

    render(<PhoneInput value="123-456" onChange={mockOnChange} />);
    expect(screen.getByDisplayValue('123-456')).toBeInTheDocument();
  });

  it('limits input to 10 digits', async () => {
    const user = userEvent.setup();
    render(<PhoneInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, '12345678901234');

    expect(mockOnChange).toHaveBeenLastCalledWith('123-456-7890');
  });

  it('prevents non-numeric character input', async () => {
    const user = userEvent.setup();
    render(<PhoneInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'abc123');

    expect(mockOnChange).toHaveBeenLastCalledWith('123');
  });

  it('displays error message when error prop is provided', () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        error="Phone number is required"
        id="phone"
      />
    );

    expect(screen.getByText('Phone number is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(
      <PhoneInput
        value=""
        onChange={mockOnChange}
        error="Phone number is required"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <PhoneInput
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
      <PhoneInput
        value=""
        onChange={mockOnChange}
        placeholder="Enter phone"
      />
    );

    expect(screen.getByPlaceholderText('Enter phone')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(
      <PhoneInput
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
      <PhoneInput
        value=""
        onChange={mockOnChange}
        error="Error"
        id="phone"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('has correct autocomplete attribute', () => {
    render(<PhoneInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'tel');
  });
});
