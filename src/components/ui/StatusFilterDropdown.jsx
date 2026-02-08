// StatusFilterDropdown - Multi-selectable status filter component
import { useState, useRef, useEffect } from 'react'
import { Filter, Check, ChevronDown } from 'lucide-react'
import { PillButton } from '@/components/ui/shared'
import { COLORS } from '@/lib/constants'

const DEFAULT_STATUS_OPTIONS = [
    { id: 'draft', label: 'Draft', color: COLORS.light.darkGrey },
    { id: 'review', label: 'In Review', color: COLORS.blue },
    { id: 'approved', label: 'Approved', color: COLORS.positive },
    { id: 'changes', label: 'Need Changes', color: COLORS.negative },
]

export function StatusFilterDropdown({ selectedStatuses = [], onStatusChange, statusOptions = DEFAULT_STATUS_OPTIONS, className, style }) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const toggleStatus = (statusId) => {
        const newStatuses = selectedStatuses.includes(statusId)
            ? selectedStatuses.filter(s => s !== statusId)
            : [...selectedStatuses, statusId]
        onStatusChange(newStatuses)
    }

    const clearAll = () => {
        onStatusChange([])
        setIsOpen(false)
    }

    const activeCount = selectedStatuses.length

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <PillButton
                variant="outline"
                type="button"
                className={className}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsOpen(!isOpen)
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: activeCount > 0 ? 'hsl(340, 82%, 59%, 0.1)' : undefined,
                    borderColor: activeCount > 0 ? COLORS.primary : undefined,
                    color: activeCount > 0 ? COLORS.primary : undefined,
                    ...style
                }}
            >
                <Filter style={{ width: '16px', height: '16px' }} />
                Filters
                {activeCount > 0 && (
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '9999px',
                        backgroundColor: COLORS.primary,
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '0 4px',
                    }}>
                        {activeCount}
                    </span>
                )}
                <ChevronDown style={{
                    width: '14px',
                    height: '14px',
                    transition: 'transform 0.2s',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }} />
            </PillButton>

            {isOpen && (
                <div className="absolute top-[calc(100%+4px)] right-0 min-w-[200px] bg-popover border border-border rounded-xl shadow-lg z-50 py-2">
                    {/* Header */}
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground border-b border-border flex justify-between items-center">
                        <span>Filter by Status</span>
                        {activeCount > 0 && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    clearAll()
                                }}
                                className="bg-transparent border-none text-[11px] text-primary cursor-pointer hover:underline"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Options */}
                    {statusOptions.map(status => {
                        const isSelected = selectedStatuses.includes(status.id)
                        return (
                            <StatusOption
                                key={status.id}
                                status={status}
                                isSelected={isSelected}
                                onToggle={() => toggleStatus(status.id)}
                            />
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// Separate component to avoid stale closure issues
function StatusOption({ status, isSelected, onToggle }) {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onToggle()
            }}
            className={`
                flex items-center gap-2.5 w-full px-4 py-2.5 border-none cursor-pointer text-left text-sm transition-colors
                ${isSelected ? 'bg-pink-500/5' : 'bg-transparent'}
                hover:bg-muted text-foreground
            `}
        >
            {/* Checkbox */}
            <div className={`
                w-4 h-4 rounded border flex items-center justify-center pointer-events-none
                ${isSelected
                    ? 'border-transparent bg-primary'
                    : 'border-muted-foreground/30 bg-background group-hover:border-muted-foreground/50'}
            `}>
                {isSelected && <Check style={{ width: '12px', height: '12px', color: 'white' }} />}
            </div>

            {/* Status dot */}
            <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: status.color,
                pointerEvents: 'none',
            }} />

            {/* Label */}
            <span className="pointer-events-none">{status.label}</span>
        </button>
    )
}
