// client/src/tests/unit/Input.test.jsx - Unit tests for Input component

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Input from '../../components/Input.jsx';

describe('Input Component', () => {
    const defaultProps = {
        id: 'test-input',
        label: 'Test Label',
        placeholder: 'Enter text here'
    };

    describe('Rendering', () => {
        it('renders with label and input', () => {
            render(<Input {...defaultProps} />);

            expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
        });

        it('renders without label when not provided', () => {
            render(<Input id="test" placeholder="No label" />);

            expect(screen.getByPlaceholderText('No label')).toBeInTheDocument();
            expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
        });

        it('shows required indicator when required prop is true', () => {
            render(<Input {...defaultProps} required />);

            expect(screen.getByText('*')).toBeInTheDocument();
            expect(screen.getByText('*')).toHaveClass('input-required');
        });

        it('applies custom className', () => {
            const { container } = render(
                <Input {...defaultProps} className="custom-input" />
            );

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveClass('custom-input');
        });

        it('applies container className', () => {
            const { container } = render(
                <Input {...defaultProps} containerClassName="custom-container" />
            );

            expect(container.firstChild).toHaveClass('custom-container');
        });
    });

    describe('Input Types', () => {
        it('renders text input by default', () => {
            render(<Input {...defaultProps} />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('type', 'text');
        });

        it('renders password input when type is password', () => {
            render(<Input {...defaultProps} type="password" />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('type', 'password');
        });

        it('renders email input when type is email', () => {
            render(<Input {...defaultProps} type="email" />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('type', 'email');
        });

        it('renders number input when type is number', () => {
            render(<Input {...defaultProps} type="number" />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('type', 'number');
        });
    });

    describe('Icons', () => {
        const TestIcon = () => <span data-testid="test-icon">🔍</span>;

        it('renders left icon when provided', () => {
            render(<Input {...defaultProps} icon={<TestIcon />} iconPosition="left" />);

            expect(screen.getByTestId('test-icon')).toBeInTheDocument();
            expect(screen.getByTestId('test-icon').parentElement).toHaveClass('input-icon-left');

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveClass('input-with-icon-left');
        });

        it('renders right icon when provided', () => {
            render(<Input {...defaultProps} icon={<TestIcon />} iconPosition="right" />);

            expect(screen.getByTestId('test-icon')).toBeInTheDocument();
            expect(screen.getByTestId('test-icon').parentElement).toHaveClass('input-icon-right');

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveClass('input-with-icon-right');
        });

        it('defaults to left icon position', () => {
            render(<Input {...defaultProps} icon={<TestIcon />} />);

            expect(screen.getByTestId('test-icon').parentElement).toHaveClass('input-icon-left');
        });
    });

    describe('States', () => {
        it('renders in disabled state', () => {
            render(<Input {...defaultProps} disabled />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toBeDisabled();
            expect(input).toHaveClass('input-disabled');
        });

        it('renders with error state', () => {
            const errorMessage = 'This field is required';
            render(<Input {...defaultProps} error={errorMessage} />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveClass('input-error');
            expect(input).toHaveAttribute('aria-invalid', 'true');

            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.getByText(errorMessage)).toHaveClass('input-error-message');
        });

        it('shows helper text when provided and no error', () => {
            const helperText = 'This is helpful information';
            render(<Input {...defaultProps} helperText={helperText} />);

            expect(screen.getByText(helperText)).toBeInTheDocument();
            expect(screen.getByText(helperText)).toHaveClass('input-helper-text');
        });

        it('prioritizes error message over helper text', () => {
            const errorMessage = 'Error occurred';
            const helperText = 'Helper text';

            render(<Input {...defaultProps} error={errorMessage} helperText={helperText} />);

            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.queryByText(helperText)).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('links input to error message via aria-describedby', () => {
            const errorMessage = 'Error message';
            render(<Input {...defaultProps} error={errorMessage} />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('aria-describedby', 'test-input-error');

            const errorElement = screen.getByText(errorMessage);
            expect(errorElement).toHaveAttribute('id', 'test-input-error');
        });

        it('links input to helper text via aria-describedby', () => {
            const helperText = 'Helper text';
            render(<Input {...defaultProps} helperText={helperText} />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('aria-describedby', 'test-input-helper');

            const helperElement = screen.getByText(helperText);
            expect(helperElement).toHaveAttribute('id', 'test-input-helper');
        });

        it('sets aria-invalid correctly for error state', () => {
            const { rerender } = render(<Input {...defaultProps} />);

            let input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('aria-invalid', 'false');

            rerender(<Input {...defaultProps} error="Error message" />);

            input = screen.getByLabelText('Test Label');
            expect(input).toHaveAttribute('aria-invalid', 'true');
        });
    });

    describe('User Interactions', () => {
        it('handles user typing', async () => {
            const user = userEvent.setup();
            render(<Input {...defaultProps} />);

            const input = screen.getByLabelText('Test Label');

            await user.type(input, 'Hello World');

            expect(input).toHaveValue('Hello World');
        });

        it('calls onChange when value changes', async () => {
            const handleChange = jest.fn();
            const user = userEvent.setup();

            render(<Input {...defaultProps} onChange={handleChange} />);

            const input = screen.getByLabelText('Test Label');

            await user.type(input, 'a');

            expect(handleChange).toHaveBeenCalled();
            expect(handleChange).toHaveBeenCalledWith(expect.any(Object));
        });

        it('calls onFocus when input receives focus', async () => {
            const handleFocus = jest.fn();
            const user = userEvent.setup();

            render(<Input {...defaultProps} onFocus={handleFocus} />);

            const input = screen.getByLabelText('Test Label');

            await user.click(input);

            expect(handleFocus).toHaveBeenCalledTimes(1);
        });

        it('calls onBlur when input loses focus', async () => {
            const handleBlur = jest.fn();
            const user = userEvent.setup();

            render(
                <div>
                    <Input {...defaultProps} onBlur={handleBlur} />
                    <button>Other element</button>
                </div>
            );

            const input = screen.getByLabelText('Test Label');
            const button = screen.getByText('Other element');

            await user.click(input);
            await user.click(button);

            expect(handleBlur).toHaveBeenCalledTimes(1);
        });

        it('does not allow interaction when disabled', async () => {
            const handleChange = jest.fn();
            const user = userEvent.setup();

            render(<Input {...defaultProps} disabled onChange={handleChange} />);

            const input = screen.getByLabelText('Test Label');

            await user.type(input, 'should not work');

            expect(input).toHaveValue('');
            expect(handleChange).not.toHaveBeenCalled();
        });
    });

    describe('Forwarded Ref', () => {
        it('forwards ref to input element', () => {
            const ref = React.createRef();
            render(<Input {...defaultProps} ref={ref} />);

            expect(ref.current).toBe(screen.getByLabelText('Test Label'));
            expect(ref.current.tagName).toBe('INPUT');
        });

        it('allows programmatic focus via ref', () => {
            const ref = React.createRef();
            render(<Input {...defaultProps} ref={ref} />);

            ref.current.focus();

            expect(document.activeElement).toBe(ref.current);
        });
    });

    describe('Props Forwarding', () => {
        it('forwards additional props to input element', () => {
            render(
                <Input
                    {...defaultProps}
                    maxLength={10}
                    autoComplete="off"
                    data-testid="forwarded-props"
                />
            );

            const input = screen.getByTestId('forwarded-props');
            expect(input).toHaveAttribute('maxLength', '10');
            expect(input).toHaveAttribute('autoComplete', 'off');
        });

        it('forwards event handlers', async () => {
            const handleKeyDown = jest.fn();
            const user = userEvent.setup();

            render(<Input {...defaultProps} onKeyDown={handleKeyDown} />);

            const input = screen.getByLabelText('Test Label');

            await user.type(input, 'a');

            expect(handleKeyDown).toHaveBeenCalled();
        });
    });

    describe('Value Control', () => {
        it('works as controlled component', async () => {
            const ControlledInput = () => {
                const [value, setValue] = React.useState('');

                return (
                    <Input
                        {...defaultProps}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                );
            };

            const user = userEvent.setup();
            render(<ControlledInput />);

            const input = screen.getByLabelText('Test Label');

            await user.type(input, 'controlled');

            expect(input).toHaveValue('controlled');
        });

        it('works as uncontrolled component with defaultValue', () => {
            render(<Input {...defaultProps} defaultValue="default text" />);

            const input = screen.getByLabelText('Test Label');
            expect(input).toHaveValue('default text');
        });
    });
});