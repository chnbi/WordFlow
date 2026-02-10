import React from 'react'
import { cn } from "@/lib/utils"
import { LAYOUT } from "@/lib/constants"

/**
 * Universal Page Layout wrapper
 * Applies consistent padding and max-width across all pages
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} [props.className] - Additional classes
 * @param {boolean} [props.noPadding] - Opt-out of standard padding
 */
export function PageLayout({ children, className, noPadding = false }) {
    return (
        <div
            className={cn(
                "w-full max-w-[1600px] mx-auto",
                !noPadding && LAYOUT.PADDING,
                className
            )}
        >
            {children}
        </div>
    )
}
