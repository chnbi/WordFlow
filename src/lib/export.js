// Export utilities for Excel/CSV exports
// Extracted from project-details.jsx and glossary-library.jsx

import * as XLSX from 'xlsx'

/**
 * Export data to Excel file
 * @param {Object[]} data - Array of objects to export
 * @param {string} filename - Output filename (without extension)
 * @param {string} sheetName - Sheet name in Excel
 * @param {Object} columnMapping - Optional mapping from data keys to column headers
 */
export function exportToExcel(data, filename, sheetName = 'Sheet1', columnMapping = null) {
    if (!data || data.length === 0) {
        return false
    }

    try {
        // If column mapping provided, transform data
        let exportData = data
        if (columnMapping) {
            exportData = data.map(row => {
                const mapped = {}
                Object.entries(columnMapping).forEach(([key, header]) => {
                    mapped[header] = row[key] ?? ''
                })
                return mapped
            })
        }

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
        XLSX.writeFile(wb, `${filename}.xlsx`)


        return true
    } catch (error) {
        return false
    }
}


/**
 * Export glossary terms to Excel
 * Standard format: English, Bahasa Malaysia, Chinese, Category, Remark
 */
export function exportGlossaryToExcel(terms, filename = 'glossary_export') {
    const columnMapping = {
        english: 'English',
        malay: 'Bahasa Malaysia',
        chinese: 'Chinese',
        category: 'Category',
        remark: 'Remark'
    }
    return exportToExcel(terms, filename, 'Glossary', columnMapping)
}
