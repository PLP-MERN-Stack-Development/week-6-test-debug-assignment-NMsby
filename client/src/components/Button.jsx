// client/src/components/Button.jsx - Reusable Button component

import React from 'react';
import PropTypes from 'prop-types';
import './Button.css';

const Button = ({
    children,
                    variant = 'primary',
                    size = 'md',
                    disabled = false,
                    loading = false,
                    type = 'button',
                    onClick,
                    className = '',
                    fullWidth = false,
                    icon = null,
                    ...props
                }) => {
    const baseClasses = 'btn';
    const variantClasses = `btn-${variant}`;
    const sizeClasses = `btn-${size}`;
    const disabledClasses = disabled || loading ? 'btn-disabled' : '';
    const fullWidthClasses = fullWidth ? 'btn-full-width' : '';
    const loadingClasses = loading ? 'btn-loading' : '';

    const allClasses = [
        baseClasses,
        variantClasses,
        sizeClasses,
        disabledClasses,
        fullWidthClasses,
        loadingClasses,
        className
    ].filter(Boolean).join(' ');

    const handleClick = (e) => {
        if (disabled || loading) return;
        if (onClick) onClick(e);
    };

    return (
        <button
            className={allClasses}
            disabled={disabled || loading}
            onClick={handleClick}
            type={type}
            {...props}
        >
            {loading && (
                <span className="btn-spinner" aria-hidden="true">
         <svg className="animate-spin" viewBox="0 0 24 24">
           <circle
               cx="12"
               cy="12"
               r="10"
               stroke="currentColor"
               strokeWidth="4"
               fill="none"
               strokeDasharray="32"
               strokeDashoffset="32"
           />
         </svg>
       </span>
            )}
            {icon && !loading && (
                <span className="btn-icon" aria-hidden="true">
         {icon}
       </span>
            )}
            <span className={loading ? 'btn-text-loading' : 'btn-text'}>
       {children}
     </span>
        </button>
    );
};

Button.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf([
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
        'info',
        'light',
        'dark',
        'outline-primary',
        'outline-secondary',
        'ghost'
    ]),
    size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    onClick: PropTypes.func,
    className: PropTypes.string,
    fullWidth: PropTypes.bool,
    icon: PropTypes.node
};

export default Button;