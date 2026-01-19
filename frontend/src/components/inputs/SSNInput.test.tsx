import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SSNInput from './SSNInput';

describe('SSNInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with label when provided', () => {
    render(
      <SSNInput
        value=""
        onChange={mockOnChange}
        label="Social Security Number"
        id="ssn"
      />
    );

    expect(screen.getByLabelText(/Social Security Number/)).toBeInTheDocument();
  });

  it('shows HIPAA protected indicator in label', () => {
    render(
      <SSNInput
        value=""
        onChange={mockOnChange}
        label="SSN"
      />
    );

    expect(screen.getByText('(HIPAA Protected)')).toBeInTheDocument();
  });

  it('shows required indicator when required prop is true', () => {
    render(
      <SSNInput
        value=""
        onChange={mockOnChange}
        label="SSN"
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('formats SSN as user types', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <SSNInput value="" onChange={mockOnChange} showToggle={false} />
    );

    const input = screen.getByRole('textbox');

    fireEvent.click(screen.getByLabelText('Show SSN'));

    await user.type(input, '123456789');

    expect(mockOnChange).toHaveBeenLastCalledWith('123-45-6789');
  });

  it('formats partial SSN correctly', () => {
    render(<SSNInput value="123" onChange={mockOnChange} />);

    fireEvent.click(screen.getByLabelText('Show SSN'));

    expect(screen.getByDisplayValue('123')).toBeInTheDocument();
  });

  it('limits input to 9 digits', async () => {
    const user = userEvent.setup();
    render(<SSNInput value="" onChange={mockOnChange} />);

    fireEvent.click(screen.getByLabelText('Show SSN'));

    const input = screen.getByRole('textbox');
    await user.type(input, '1234567890123');

    expect(mockOnChange).toHaveBeenLastCalledWith('123-45-6789');
  });

  it('prevents non-numeric character input', async () => {
    const user = userEvent.setup();
    render(<SSNInput value="" onChange={mockOnChange} />);

    fireEvent.click(screen.getByLabelText('Show SSN'));

    const input = screen.getByRole('textbox');
    await user.type(input, 'abc123');

    expect(mockOnChange).toHaveBeenLastCalledWith('123');
  });

  it('masks SSN by default', () => {
    render(<SSNInput value="123-45-6789" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('\u2022\u2022\u2022-\u2022\u2022-6789');
  });

  it('shows visibility toggle button by default', () => {
    render(<SSNInput value="123-45-6789" onChange={mockOnChange} />);

    expect(screen.getByLabelText('Show SSN')).toBeInTheDocument();
  });

  it('hides visibility toggle when showToggle is false', () => {
    render(
      <SSNInput
        value="123-45-6789"
        onChange={mockOnChange}
        showToggle={false}
      />
    );

    expect(screen.queryByLabelText('Show SSN')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Hide SSN')).not.toBeInTheDocument();
  });

  it('toggles visibility when clicking toggle button', () => {
    render(<SSNInput value="123-45-6789" onChange={mockOnChange} />);

    const toggleButton = screen.getByLabelText('Show SSN');
    fireEvent.click(toggleButton);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('123-45-6789');
    expect(screen.getByLabelText('Hide SSN')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(
      <SSNInput
        value=""
        onChange={mockOnChange}
        error="SSN is required"
        id="ssn"
      />
    );

    expect(screen.getByText('SSN is required')).toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(
      <SSNInput
        value=""
        onChange={mockOnChange}
        error="SSN is required"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <SSNInput
        value=""
        onChange={mockOnChange}
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('disables toggle button when input is disabled', () => {
    render(
      <SSNInput
        value="123-45-6789"
        onChange={mockOnChange}
        disabled
      />
    );

    const toggleButton = screen.getByLabelText('Show SSN');
    expect(toggleButton).toBeDisabled();
  });

  it('has autocomplete off for security', () => {
    render(<SSNInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('has data-sensitive attribute for HIPAA compliance', () => {
    render(<SSNInput value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('data-sensitive', 'true');
  });

  it('sets aria-invalid when error is present', () => {
    render(
      <SSNInput
        value=""
        onChange={mockOnChange}
        error="Error"
        id="ssn"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
