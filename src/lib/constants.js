// Centralized constants for the application
// These are shared across multiple components and pages

// ============================================
// STATUS CONFIGURATION
// Used for status badges, filters, and displays
// ============================================

export const STATUS_CONFIG = {
    // Common statuses for projects, glossary, translations
    draft: {
        id: 'draft',
        label: 'Draft',
        color: '#94a3b8',  // slate-400
    },
    review: {
        id: 'review',
        label: 'In Review',
        color: '#3b82f6',  // blue-500
    },
    approved: {
        id: 'approved',
        label: 'Approved',
        color: '#10b981',  // emerald-500
    },
    changes: {
        id: 'changes',
        label: 'Need Changes',
        color: '#ef4444',  // red-500
    },
    // Approvals-specific statuses
    pending: {
        id: 'pending',
        label: 'Pending',
        color: '#f59e0b',  // amber-500
    },
    rejected: {
        id: 'rejected',
        label: 'Rejected',
        color: '#ef4444',  // red-500
    },
    // Prompt-specific statuses
    published: {
        id: 'published',
        label: 'Published',
        color: '#10b981',  // emerald-500
    },
    // Legacy statuses for backward compatibility
    completed: {
        id: 'completed',
        label: 'Approved',
        color: '#10b981',  // Maps to approved color
    },
    error: {
        id: 'error',
        label: 'Error',
        color: '#ef4444',  // red-500
    },
}

// Helper to get status config with fallback
export const getStatusConfig = (status, fallback = 'draft') => {
    return STATUS_CONFIG[status] || STATUS_CONFIG[fallback]
}

// Status options for filter dropdowns
export const STATUS_FILTER_OPTIONS = [
    STATUS_CONFIG.draft,
    STATUS_CONFIG.review,
    STATUS_CONFIG.approved,
    STATUS_CONFIG.changes,
]

// ============================================
// LANGUAGE CONFIGURATION
// Central source of truth for all supported languages
// To add a new language: simply add an entry below with the same structure
// ============================================

export const LANGUAGES = {
    en: { id: 'en', code: 'en', label: 'English', nativeLabel: 'English', direction: 'ltr' },
    my: { id: 'my', code: 'my', label: 'Bahasa Malaysia', nativeLabel: 'Bahasa Malaysia', direction: 'ltr' },
    zh: { id: 'zh', code: 'zh', label: 'Simplified Chinese', nativeLabel: '简体中文', direction: 'ltr' },
    // Future languages can be added here:
    // ja: { id: 'ja', code: 'ja', label: 'Japanese', nativeLabel: '日本語', direction: 'ltr' },
}

// Default source language (can be overridden per project)
export const DEFAULT_SOURCE_LANGUAGE = 'en'

// Default target languages for new projects
export const DEFAULT_TARGET_LANGUAGES = ['my', 'zh']

// Get all language codes as array
export const getLanguageCodes = () => Object.keys(LANGUAGES)

// Get languages as array for dropdowns
export const getLanguagesArray = () => Object.values(LANGUAGES)

// Get language label by code
export const getLanguageLabel = (code) => {
    return LANGUAGES[code]?.label || code
}

// Get native label by code (for display in that language)
export const getNativeLabel = (code) => {
    return LANGUAGES[code]?.nativeLabel || LANGUAGES[code]?.label || code
}


// ============================================
// DESIGN TOKENS
// Centralized styling values
// ============================================

export const DESIGN_TOKENS = {
    fontSize: {
        xs: '11px',
        sm: '12px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '24px',
    },
    radius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        full: '9999px',
    },
}

// ============================================
// COLORS - Single Source of Truth (Figma Palette)
// ============================================

export const COLORS = {
    // === CORE ===
    fuchsia: '#FF0084',
    blue: '#5174FF',
    spaceCadet: '#1C2541',
    black: '#0D0D0D',
    white: '#FFFFFF',

    // === ACCENTS ===
    aquamarine: '#76E5E0',
    jasmine: '#F9E784',
    salmon: '#FFA69E',
    yorkieBlue: '#82A3CC',

    // === BASE (Light Mode) ===
    light: {
        paperWhite: '#F9F9F9',     // Background
        ghostwater: '#F1F1F3',     // Card / Secondary BG
        lightGrey: '#E5E6EB',      // Borders / Muted BG
        darkGrey: '#B4B6C1',       // Disabled / Placeholder
    },

    // === BASE (Dark Mode) ===
    dark: {
        paperWhite: '#1A1A24',     // Background
        ghostwater: '#252532',     // Card / Secondary BG
        lightGrey: '#32323E',      // Borders / Muted BG
        darkGrey: '#47475A',       // Subtle elements
        black: '#0A0A0F',          // Deepest
    },

    // === STROKE ===
    stroke: {
        light: '#E5E6EB',
        dark: '#32323E',
    },

    // === CONTENT / TEXT ===
    content: {
        light: {
            primary: '#0D0D0D',    // Black
            secondary: '#52535E',  // Dark Grey
            muted: '#7E7F8A',      // Mid Grey
            disabled: '#B4B6C1',   // Light Grey
        },
        dark: {
            primary: '#FFFFFF',    // White
            secondary: '#B4B6C1',  // Light Grey
            muted: '#7E7F8A',      // Mid Grey
            disabled: '#52535E',   // Dark Grey
        },
    },

    // === STATES ===
    positive: '#4ADE80',   // Green
    positiveHover: '#22C55E',
    warning: '#FACC15',    // Yellow
    warningHover: '#EAB308',
    negative: '#EF4444',   // Red
    negativeHover: '#DC2626',

    // === BUTTONS ===
    buttons: {
        primary: '#FF0084',
        primaryHover: '#E60077',
        primaryPressed: '#CC006A',
        secondary: '#F9F9F9',
        secondaryHover: '#E5E6EB',
        secondaryPressed: '#D1D2D9',
        tertiary: 'transparent',
        tertiaryHover: '#FFE5EC',
        tertiaryPressed: '#FFB9DD',
    },

    // === SEMANTIC ALIASES (for quick access) ===
    primary: '#FF0084',
    primaryHover: '#E60077',
    primaryLight: '#FFB9DD',
    primaryLightest: '#FFE5EC',
}

// Helper to get color with optional opacity
export const getColor = (colorPath, opacity = 1) => {
    const parts = colorPath.split('.')
    let value = COLORS
    for (const part of parts) {
        value = value?.[part]
    }
    if (!value || typeof value !== 'string') return colorPath
    if (opacity === 1) return value
    // Convert hex to rgba
    const hex = value.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
