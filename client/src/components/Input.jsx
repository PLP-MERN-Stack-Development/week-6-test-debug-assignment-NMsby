// client/src/components/Input.jsx - Reusable Input component

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

const Input = forwardRef(({
                              id,
                              label,
                              type = 'text',
                              placeholder,
                              value,
                              defaultValue,
                              onChange,
                              onFocus,
                              onBlur,
                              error,
                              helperText,
                              required = false,
                              disabled = false,
                              className = '',
                              containerClassName = '',
                              icon,
                              iconPosition = 'left',
                              ...props
                          }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const hasIcon = Boolean(icon);

    const inputClasses = [
        'input',
        `input-${type}`,
        hasError ? 'input-error' : '',
        disabled ? 'input-disabled' : '',
        hasIcon ? `input-with-icon-${iconPosition}` : '',
        className
    ].filter(Boolean).join(' ');

    const containerClasses = [
        'input-container',
        containerClassName
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses}>
            {label && (
                <label htmlFor={inputId} className="input-label">
                    {label}
                    {required && <span className="input-required">*</span>}
                </label>
            )}

            <div className="input-wrapper">
                {hasIcon && iconPosition === 'left' && (
                    <div className="input-icon input-icon-left">
                        {icon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    defaultValue={defaultValue}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    disabled={disabled}
                    required={required}
                    className={inputClasses}
                    aria-invalid={hasError}
                    aria-describedby={
                        hasError ? `${inputId}-error` :
                            helperText ? `${inputId}-helper` :
                                undefined
                    }
                    {...props}
                />

                {hasIcon && iconPosition === 'right' && (
                    <div className="input-icon input-icon-right">
                        {icon}
                    </div>
                )}
            </div>

            {hasError && (
                <div
                    id={`${inputId}-error`}
                    className="input-error-message"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {!hasError && helperText && (
                <div
                    id={`${inputId}-helper`}
                    className="input-helper-text"
                >
                    {helperText}
                </div>
            )}
        </div>
    );
});

Input.displayName = 'Input';

Input.propTypes = {
    id: PropTypes.string,
    label: PropTypes.string,
    type: PropTypes.oneOf([
        'text', 'password', 'email', 'number', 'tel', 'url', 'search'
    ]),
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    error: PropTypes.string,
    helperText: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    className: PropTypes.string,
    containerClassName: PropTypes.string,
    icon: PropTypes.node,
    iconPosition: PropTypes.oneOf(['left', 'right'])
};

export default Input;