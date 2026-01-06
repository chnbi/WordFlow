// useRowSelection - Hook for managing row selection state
import { useState, useCallback } from 'react'

/**
 * Manages row selection state for projects
 * @returns Selection state and handlers
 */
export function useRowSelection() {
    // { projectId: Set<rowId> }
    const [selectedRows, setSelectedRows] = useState({})

    // Get selected row IDs for a project
    const getSelectedRowIds = useCallback((projectId) => {
        return selectedRows[projectId] || new Set()
    }, [selectedRows])

    // Toggle row selection
    const toggleRowSelection = useCallback((projectId, rowId) => {
        setSelectedRows(prev => {
            const current = new Set(prev[projectId] || [])
            if (current.has(rowId)) {
                current.delete(rowId)
            } else {
                current.add(rowId)
            }
            return { ...prev, [projectId]: current }
        })
    }, [])

    // Select all rows in a project
    const selectAllRows = useCallback((projectId, rows) => {
        const allIds = new Set(rows.map(r => r.id))
        setSelectedRows(prev => ({ ...prev, [projectId]: allIds }))
    }, [])

    // Deselect all rows in a project
    const deselectAllRows = useCallback((projectId) => {
        setSelectedRows(prev => ({ ...prev, [projectId]: new Set() }))
    }, [])

    // Select rows by filter (e.g., only pending)
    const selectRowsByStatus = useCallback((projectId, rows, status) => {
        const filteredIds = new Set(rows.filter(r => r.status === status).map(r => r.id))
        setSelectedRows(prev => ({ ...prev, [projectId]: filteredIds }))
    }, [])

    // Clear selection for specific row IDs (used after delete)
    const clearRowsFromSelection = useCallback((projectId, rowIds) => {
        setSelectedRows(prev => {
            const current = new Set(prev[projectId] || [])
            rowIds.forEach(id => current.delete(id))
            return { ...prev, [projectId]: current }
        })
    }, [])

    return {
        getSelectedRowIds,
        toggleRowSelection,
        selectAllRows,
        deselectAllRows,
        selectRowsByStatus,
        clearRowsFromSelection,
    }
}
