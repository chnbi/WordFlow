
import React from 'react'
import { Check, CheckSquare, Square, ArrowUpDown } from 'lucide-react'

// ==========================================
// STANDARDIZED TABLE STYLES (Figma-based)
// Export for use in other components like Quick Check
// ==========================================
export const TABLE_STYLES = {
    // Container
    container: 'rounded-2xl bg-card shadow-sm overflow-hidden border border-border',

    // Padding values
    cellPaddingX: '16px',
    cellPaddingY: '12px',
    headerPaddingY: '14px',
    checkboxColumnWidth: '52px',

    // Colors (CSS Variables preferred for proper theme support)
    borderColor: 'var(--border)', // Use fallback if variable not set? 'hsl(var(--border))' usually
    headerBg: 'hsl(var(--muted) / 0.5)',
    headerText: 'hsl(var(--muted-foreground))',
    cellText: 'hsl(var(--foreground))',
    primaryColor: 'hsl(var(--primary))',
    mutedColor: 'hsl(var(--muted-foreground))',

    // Computed padding strings
    get headerPadding() { return `${this.headerPaddingY} ${this.cellPaddingX}` },
    get cellPadding() { return `${this.cellPaddingY} ${this.cellPaddingX}` },
}

/**
 * Reusable Data Table Component
 * Enforces consistent styling, checkbox widths, and interaction patterns across the app.
 * 
 * @param {Array} columns - Column definitions: { header: string, accessor: string|func, width: string, minWidth: string, align: 'left'|'center'|'right', render: func }
 * @param {Array} data - Array of data objects
 * @param {Set|Array} selectedIds - Set or Array of selected row IDs
 * @param {Function} onToggleSelect - Handler for row selection toggle (id) => void
 * @param {Function} onToggleSelectAll - Handler for select all () => void
 * @param {Function} onRowClick - Optional handler for row click (row) => void
 * @param {Object} sortConfig - Optional sort config { key, direction }
 * @param {Function} onSort - Optional sort handler (key) => void
 * @param {Boolean} scrollable - If true, table is horizontally scrollable with minWidth columns
 */
export function DataTable({
    columns = [],
    data = [],
    selectedIds = new Set(), // Can accept Set or Array, normalized internally
    onToggleSelect,
    onToggleSelectAll,
    onRowClick,
    sortConfig,
    onSort,
    scrollable = false,
    getRowStyle,
    children
}) {
    // Normalize selection check
    const isSelected = (id) => {
        if (Array.isArray(selectedIds)) return selectedIds.includes(id)
        if (selectedIds instanceof Set) return selectedIds.has(id)
        return false
    }

    const selectedCount = Array.isArray(selectedIds) ? selectedIds.length : selectedIds.size
    const isAllSelected = data.length > 0 && selectedCount === data.length

    return (
        <div className={TABLE_STYLES.container}>
            <div style={{ overflowX: scrollable ? 'auto' : 'visible' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: scrollable ? 'auto' : 'fixed', minWidth: scrollable ? 'max-content' : undefined }}>
                    {/* Colgroup defines fixed column widths */}
                    <colgroup>
                        {onToggleSelect && <col style={{ width: TABLE_STYLES.checkboxColumnWidth }} />}
                        {columns.map((col, idx) => (
                            <col key={idx} style={{ width: col.width || 'auto' }} />
                        ))}
                    </colgroup>
                    <thead className="bg-muted/30">
                        <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                            {/* Checkbox Column */}
                            {onToggleSelect && (
                                <th style={{ padding: TABLE_STYLES.headerPadding, textAlign: 'center' }} className="first:rounded-tl-xl last:rounded-tr-xl">
                                    <button
                                        onClick={onToggleSelectAll}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer', border: 'none', background: 'none' }}
                                    >
                                        {isAllSelected ? (
                                            <CheckSquare style={{ width: '16px', height: '16px', color: TABLE_STYLES.primaryColor }} />
                                        ) : (
                                            <Square style={{ width: '16px', height: '16px', color: TABLE_STYLES.mutedColor }} />
                                        )}
                                    </button>
                                </th>
                            )}

                            {/* Data Columns */}
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className="first:rounded-tl-xl last:rounded-tr-xl"
                                    style={{
                                        padding: TABLE_STYLES.headerPadding,
                                        textAlign: col.align || 'left',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        color: TABLE_STYLES.headerText,
                                        cursor: col.sortable ? 'pointer' : 'default',
                                        userSelect: 'none'
                                    }}
                                    onClick={() => col.sortable && onSort && onSort(col.accessor)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: col.align === 'center' ? 'center' : 'flex-start' }}>
                                        {col.header}
                                        {col.sortable && (
                                            <ArrowUpDown style={{
                                                width: '12px',
                                                height: '12px',
                                                opacity: sortConfig?.key === col.accessor ? 1 : 0.4,
                                                color: sortConfig?.key === col.accessor ? TABLE_STYLES.primaryColor : 'inherit'
                                            }} />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (onToggleSelect ? 1 : 0)} style={{ padding: '32px', textAlign: 'center', color: TABLE_STYLES.mutedColor }}>
                                    No data found
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => {
                                const selected = onToggleSelect ? isSelected(row.id) : false
                                const customStyle = getRowStyle ? getRowStyle(row) : {}
                                const bgColor = selected ? 'hsl(var(--primary) / 0.05)' : (customStyle.backgroundColor || 'transparent')

                                return (
                                    <tr
                                        key={row.id || rowIndex}
                                        onClick={() => onRowClick && onRowClick(row)}
                                        className={`transition-colors ${onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
                                        style={{
                                            borderBottom: '1px solid hsl(var(--border))',
                                            backgroundColor: bgColor,
                                            ...customStyle,
                                            // Ensure backgroundColor is handled above to avoid conflict
                                            backgroundColor: bgColor
                                        }}
                                    >
                                        {/* Checkbox Cell */}
                                        {onToggleSelect && (
                                            <td style={{ padding: TABLE_STYLES.cellPadding, textAlign: 'center' }}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onToggleSelect(row.id)
                                                    }}
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', cursor: 'pointer', border: 'none', background: 'none' }}
                                                >
                                                    {selected ? (
                                                        <CheckSquare style={{ width: '16px', height: '16px', color: TABLE_STYLES.primaryColor }} />
                                                    ) : (
                                                        <Square style={{ width: '16px', height: '16px', color: TABLE_STYLES.mutedColor }} />
                                                    )}
                                                </button>
                                            </td>
                                        )}

                                        {/* Data Cells */}
                                        {columns.map((col, colIdx) => {
                                            let cellContent = row[col.accessor]
                                            if (col.render) {
                                                cellContent = col.render(row)
                                            }

                                            return (
                                                <td
                                                    key={colIdx}
                                                    style={{
                                                        padding: TABLE_STYLES.cellPadding,
                                                        fontSize: '14px',
                                                        textAlign: col.align || 'left',
                                                        color: col.color || TABLE_STYLES.cellText
                                                    }}
                                                >
                                                    {cellContent}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )
                            })
                        )}
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
