// client/src/components/Input.jsx - Reusable Input component

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

const Input = forwardRef(({
                              label,
                              type = 'text',
                              error,
                              helperText,
                              required = false,
                              disabled = false,
                              placeholder,
                              className = '',
                              containerClassName = '',
                              icon = null,
                              iconPosition = 'left',
                              ...props
                          }, ref) => {
    const inputClasses = [
        'input-field',
        error ? 'input-error' : '',
        disabled ? 'input-disabled' : '',
        icon ? `input-with-icon-${iconPosition}` : '',
        className
    ].filter(Boolean).join(' ');

    const containerClasses = [
        'input-container',
        containerClassName
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            {label && (
                <label className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}
            <div className="input-wrapper">
                {icon && iconPosition === 'left' && (
                    <div className="input-icon input-icon-left">
                        {icon}
                    </div>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={inputClasses}
                    disabled={disabled}
                    placeholder={placeholder}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined}
                    {...props}
                />
                {icon && iconPosition === 'right' && (
                    <div className="input-icon input-icon-right">
                        {icon}
                    </div>
                )}
            </div>
            {error && (
                <div className="input-error-message" id={`${props.id}-error`}>
                    {error}
                </div>
            )}
            {helperText && !error && (
                <div className="input-helper-text" id={`${props.id}-helper`}>
                    {helperText}
                </div>
            )}
        </div>
    );
});

Input.displayName = 'Input';

Input.propTypes = {
    label: PropTypes.string,
    type: PropTypes.string,
    error: PropTypes.string,
    helperText: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    containerClassName: PropTypes.string,
    icon: PropTypes.node,
    iconPosition: PropTypes.oneOf(['left', 'right']),
    id: PropTypes.string
};

export default Input;