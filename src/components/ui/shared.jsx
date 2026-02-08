// Shared UI Components - Concise & Clean
// All colors are defined in constants.js - use COLORS or Tailwind classes

import React from 'react'
import { Button } from "./button"
import { COLORS } from '@/lib/constants'

// ============================================
// CONSTANTS
// ============================================

export const PROJECT_THEMES = [
    { id: 'pink', color: COLORS.primaryLightest, border: COLORS.primaryLight, iconColor: COLORS.primary },
    { id: 'orange', color: '#FFF0E5', border: '#FFDAB9', iconColor: COLORS.salmon },
    { id: 'yellow', color: COLORS.jasmine + '20', border: COLORS.jasmine, iconColor: COLORS.jasmine },
    { id: 'mint', color: COLORS.aquamarine + '20', border: COLORS.aquamarine, iconColor: COLORS.positive },
    { id: 'cyan', color: COLORS.yorkieBlue + '20', border: COLORS.yorkieBlue, iconColor: COLORS.blue },
    { id: 'purple', color: '#F3E5FF', border: '#D8B4FE', iconColor: COLORS.spaceCadet },
]

// Re-export COLORS for backward compatibility
export { COLORS }

// ============================================
// FORM COMPONENTS
// ============================================

export function FormField({ label, required, children, className }) {
    return (
        <div className={`mb-6 ${className || ''}`}>
            <label className="block text-sm font-medium text-foreground mb-2">
                {label} {required && <span className="text-primary">*</span>}
            </label>
            {children}
        </div>
    )
}

export function TextInput({ className, ...props }) {
    return (
        <input
            type="text"
            className={`w-full px-4 py-3 text-sm rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/20 ${className || ''}`}
            {...props}
        />
    )
}

// ============================================
// BUTTON COMPONENTS
// ============================================

// ============================================
// LAYOUT COMPONENTS
// ============================================

export function PageContainer({ children, className }) {
    return (
        <div className={`w-full max-w-[1600px] mx-auto p-6 md:p-8 ${className || ''}`}>
            {children}
        </div>
    )
}

export function SectionContainer({ children, className }) {
    return (
        <div className={`mb-6 flex flex-col gap-4 ${className || ''}`}>
            {children}
        </div>
    )
}

export function Card({ children, className, noPadding = false }) {
    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 ${!noPadding ? 'p-6' : ''} ${className || ''}`}>
            {children}
        </div>
    )
}

// ============================================
// BUTTON COMPONENTS
// ============================================

export function PrimaryButton({ children, onClick, disabled, type = 'button', style, className }) {
    return (
        <Button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={style}
            className={`h-10 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium transition-all active:scale-[0.98] ${className || ''}`}
        >
            {children}
        </Button>
    )
}

export function SecondaryButton({ children, onClick, type = 'button', style, className, disabled }) {
    return (
        <Button
            variant="outline"
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={style}
            className={`h-10 px-4 py-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all active:scale-[0.98] ${className || ''}`}
        >
            {children}
        </Button>
    )
}

export const IconButton = React.forwardRef(({ children, onClick, title, className, variant = 'ghost', ...props }, ref) => {
    return (
        <Button
            ref={ref}
            variant={variant}
            size="icon"
            onClick={onClick}
            title={title}
            className={`h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors ${className || ''}`}
            {...props}
        >
            {children}
        </Button>
    )
})
IconButton.displayName = 'IconButton'

export const PillButton = React.forwardRef(function PillButton({ children, onClick, disabled, variant = 'outline', style, className, type = 'button', ...props }, ref) {
    return (
        <Button
            ref={ref}
            type={type}
            variant={variant === 'outline' ? 'outline' : 'default'}
            onClick={onClick}
            disabled={disabled}
            style={style}
            className={`rounded-full h-8 px-4 text-xs font-medium ${className || ''}`}
            {...props}
        >
            {children}
        </Button>
    )
})

export function Badge({ children, variant = 'default', className }) {
    const variants = {
        default: 'bg-gray-100 text-gray-600',
        primary: 'bg-primary/10 text-primary',
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        danger: 'bg-red-100 text-red-700',
        info: 'bg-blue-100 text-blue-700',
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.default} ${className || ''}`}>
            {children}
        </span>
    )
}

// ============================================
// MODAL COMPONENTS
// ============================================

export function ModalOverlay({ children, onClose }) {
    return (
        <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
            {children}
        </div>
    )
}

export function ModalContent({ children, maxWidth = '560px' }) {
    return (
        <div
            className="bg-background rounded-3xl p-10 w-full shadow-2xl"
            style={{ maxWidth }}
        >
            {children}
        </div>
    )
}

export function ModalHeader({ title, onClose }) {
    return (
        <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground px-2">
                {title}
            </h2>
            {onClose && (
                <IconButton onClick={onClose}>
                    <span className="text-lg">×</span>
                </IconButton>
            )}
        </div>
    )
}

// ============================================
// TAG COMPONENTS
// ============================================

export function RemovableTag({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-sm text-foreground">
            {label}
            <button
                type="button"
                onClick={onRemove}
                className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-foreground/10"
            >
                ×
            </button>
        </span>
    )
}

export function TagContainer({ children }) {
    return (
        <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-border min-h-12 items-center">
            {children}
        </div>
    )
}

// ============================================
// TABLE COMPONENTS
// ============================================

export function TableActionButton({ children, onClick, title }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="flex items-center justify-center w-6 h-6 rounded bg-transparent cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted"
        >
            {children}
        </button>
    )
}

// ============================================
// DROPDOWN COMPONENTS
// ============================================

export function SelectDropdown({ value, onChange, options, placeholder, className }) {
    return (
        <div className={`relative ${className || ''}`}>
            <select
                value={value}
                onChange={onChange}
                className="w-full h-11 px-4 pr-10 text-sm rounded-xl border border-border bg-background outline-none cursor-pointer appearance-none"
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
        </div>
    )
}
