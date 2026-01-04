// ProjectView - Project translation workspace with row selection and template-based translation
import { useState, useEffect, useRef } from "react"
import { FileSpreadsheet, Languages, Download, CheckCircle, Clock, Sparkles, Copy, ArrowLeft, ChevronDown, Square, CheckSquare, Loader2, AlertCircle, X, Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/context/ProjectContext"
import { usePrompts } from "@/context/PromptContext"
import * as XLSX from "xlsx"

// Extended status colors
const statusColors = {
    'completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    'review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    'pending': 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300',
    'queued': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    'translating': 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    'error': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const statusLabels = {
    'completed': 'Done',
    'review': 'Review',
    'pending': 'Pending',
    'queued': 'Queued',
    'translating': 'Translating',
    'error': 'Error',
}

export default function ProjectView({ projectId }) {
    const {
        getProject,
        getProjectRows,
        updateProjectRow,
        addProjectRows,
        // Pages (multi-sheet support)
        getProjectPages,
        getPageRows,
        getSelectedPageId,
        selectPage,
        addProjectPage,
        // Selection
        getSelectedRowIds,
        toggleRowSelection,
        selectAllRows,
        deselectAllRows,
        selectRowsByStatus,
        translateSelectedRows,
        cancelTranslationQueue,
        isProcessing,
        queueProgress,
    } = useProjects()

    const { templates } = usePrompts()

    const [editingCell, setEditingCell] = useState(null)
    const [editValue, setEditValue] = useState("")
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
    const [showAddRowModal, setShowAddRowModal] = useState(false)
    const [newRowText, setNewRowText] = useState("")
    const [isImporting, setIsImporting] = useState(false)
    const fileInputRef = useRef(null)

    // Get project ID from URL if not passed as prop
    const id = projectId || window.location.hash.split('/')[1]
    const project = getProject(id)

    // Get pages and determine which rows to show
    const pages = getProjectPages(id)
    const currentPageId = getSelectedPageId(id)
    const legacyRows = getProjectRows(id)

    // Use page rows if pages exist, otherwise use legacy flat rows
    const rows = pages.length > 0 && currentPageId
        ? getPageRows(id, currentPageId)
        : legacyRows

    const selectedRowIds = getSelectedRowIds(id)
    const selectedCount = selectedRowIds.size

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
                <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
                <Button variant="outline" onClick={() => window.location.hash = '#projects'}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
                </Button>
            </div>
        )
    }

    // Calculate stats from rows
    const totalRows = rows.length
    const translatedRows = rows.filter(r => r.my && r.zh).length
    const pendingReview = rows.filter(r => r.status === 'review').length
    const progress = totalRows > 0 ? Math.round((translatedRows / totalRows) * 100) : 0

    // Handle cell editing
    const handleCellClick = (rowId, field, currentValue) => {
        setEditingCell({ rowId, field })
        setEditValue(currentValue || "")
    }

    const handleCellSave = () => {
        if (!editingCell) return

        const row = rows.find(r => r.id === editingCell.rowId)
        if (row) {
            const updates = { [editingCell.field]: editValue }
            // Update status based on translations
            const newMy = editingCell.field === 'my' ? editValue : row.my
            const newZh = editingCell.field === 'zh' ? editValue : row.zh
            if (newMy && newZh) {
                updates.status = 'completed'
            } else if (newMy || newZh) {
                updates.status = 'review'
            }
            updateProjectRow(id, editingCell.rowId, updates)
        }

        setEditingCell(null)
        setEditValue("")
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleCellSave()
        } else if (e.key === 'Escape') {
            setEditingCell(null)
            setEditValue("")
        }
    }

    // Copy source to target
    const handleCopySource = (row, targetField) => {
        updateProjectRow(id, row.id, { [targetField]: row.en || row.source })
    }

    // Handle template selection for translation
    const handleTranslateWithTemplate = (template) => {
        translateSelectedRows(id, template)
        setShowTemplateDropdown(false)
    }

    // Handle select all checkbox
    const handleSelectAll = () => {
        if (selectedCount === rows.length) {
            deselectAllRows(id)
        } else {
            selectAllRows(id)
        }
    }

    // Export to Excel
    const handleExport = () => {
        const exportData = rows.map(row => ({
            'Source': row.source || row.en,
            'English': row.en,
            'Bahasa Malaysia': row.my,
            '中文': row.zh,
            'Status': row.status,
            'Template Used': row.templateUsed || ''
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Translations")
        XLSX.writeFile(wb, `${project.name}_export.xlsx`)
    }

    // Handle importing Excel file (all sheets as pages)
    const handleImportSheet = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)

            // Import ALL sheets as separate pages
            let totalRows = 0
            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet)

                // Map Excel columns to row format
                const newRows = jsonData.map((row, idx) => ({
                    key: row.Key || row.key || `row_${Date.now()}_${idx}`,
                    en: row.English || row.en || row.EN || row.Source || row.source || '',
                    my: row['Bahasa Malaysia'] || row.BM || row.my || row.Malay || '',
                    zh: row.Chinese || row['中文'] || row.zh || row.ZH || '',
                    status: 'pending',
                })).filter(row => row.en) // Only rows with English source

                if (newRows.length > 0) {
                    // Create a page for this sheet
                    if (typeof addProjectPage === 'function') {
                        await addProjectPage(id, { name: sheetName }, newRows)
                        console.log(`✅ Created page "${sheetName}" with ${newRows.length} rows`)
                    } else {
                        // Fallback to legacy flat rows
                        await addProjectRows(id, newRows)
                        console.log(`✅ Imported ${newRows.length} rows from "${sheetName}"`)
                    }
                    totalRows += newRows.length
                }
            }

            console.log(`✅ Imported ${workbook.SheetNames.length} sheets with ${totalRows} total rows`)
        } catch (error) {
            console.error('Error importing file:', error)
        } finally {
            setIsImporting(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    // Handle adding a single row
    const handleAddRow = async () => {
        if (!newRowText.trim()) return

        const newRow = {
            key: `row_${Date.now()}`,
            en: newRowText.trim(),
            my: '',
            zh: '',
            status: 'pending',
        }

        await addProjectRows(id, [newRow])
        setNewRowText('')
        setShowAddRowModal(false)
    }

    return (
        <div className="space-y-6 w-full">
            {/* Hidden file input for import */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportSheet}
                accept=".xlsx,.xls,.csv"
                className="hidden"
            />

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        {project.sourceLanguage} → {project.targetLanguages?.join(", ")}
                    </p>
                </div>

                {/* Page Tabs (when multi-sheet project) */}
                {pages.length > 0 && (
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
                        {pages.map((page) => (
                            <button
                                key={page.id}
                                onClick={() => selectPage(id, page.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${currentPageId === page.id
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                                    }`}
                            >
                                {page.name}
                            </button>
                        ))}
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                    >
                        {isImporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4 mr-2" />
                        )}
                        {isImporting ? 'Importing...' : 'Import Sheet'}
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => setShowAddRowModal(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Row
                    </Button>
                    <Button variant="outline" className="rounded-xl" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl p-5 bg-card border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                            <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total Rows</span>
                    </div>
                    <span className="text-3xl font-light">{totalRows}</span>
                </div>

                <div className="rounded-2xl p-5 bg-card border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">Translated</span>
                    </div>
                    <span className="text-3xl font-light">{translatedRows}</span>
                </div>

                <div className="rounded-2xl p-5 bg-card border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">Pending Review</span>
                    </div>
                    <span className="text-3xl font-light">{pendingReview}</span>
                </div>

                <div className="rounded-2xl p-5 bg-card border border-border">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                            <Languages className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">Progress</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl font-light">{progress}%</span>
                        <Progress value={progress} className="flex-1 h-2" />
                    </div>
                </div>
            </div>

            {/* Selection Toolbar */}
            {selectedCount > 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-sm font-medium">
                        {selectedCount} row{selectedCount > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => deselectAllRows(id)}>
                            Clear
                        </Button>
                        <div className="relative">
                            <Button
                                size="sm"
                                className="rounded-xl gap-2"
                                onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Translate Selected
                                        <ChevronDown className="w-4 h-4" />
                                    </>
                                )}
                            </Button>

                            {/* Template Dropdown */}
                            {showTemplateDropdown && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border rounded-xl shadow-lg z-50">
                                    <div className="p-2">
                                        <p className="text-xs text-muted-foreground px-2 py-1 mb-1">Select Prompt Template</p>
                                        {templates.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleTranslateWithTemplate(template)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm flex items-center gap-2"
                                            >
                                                <div className={`w-6 h-6 rounded-md ${template.iconBg || 'bg-zinc-100'} flex items-center justify-center`}>
                                                    {template.icon && <template.icon className={`w-3 h-3 ${template.iconColor || 'text-zinc-600'}`} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{template.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{template.tags?.join(', ')}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Queue Progress */}
            {isProcessing && queueProgress.total > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-violet-900 dark:text-violet-100">
                            Processing batch {queueProgress.current + 1} of {queueProgress.total}
                        </p>
                        <Progress value={((queueProgress.current) / queueProgress.total) * 100} className="h-1.5 mt-2" />
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelTranslationQueue}
                        className="text-violet-700 hover:text-violet-900 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-800"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                </div>
            )}

            {/* Translation Items */}
            <div className="space-y-2">
                {/* Quick Actions Bar */}
                <div className="flex items-center justify-between px-1 py-2">
                    <div className="flex items-center gap-2">
                        <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            {selectedCount === rows.length && rows.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            Select all
                        </button>
                        {rows.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                                {rows.length} item{rows.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* Translation Keys - Lokalise Style */}
                {rows.map((row) => {
                    const isSelected = selectedRowIds.has(row.id)
                    const isTranslating = row.status === 'translating'
                    const isError = row.status === 'error'

                    // Language row helper component
                    const LanguageRow = ({ lang, label, value, isSource = false }) => {
                        const isEditing = editingCell?.rowId === row.id && editingCell?.field === lang
                        const isEmpty = !value

                        return (
                            <div className={`flex border-t border-border/50 ${isSource ? 'bg-muted/20' : ''}`}>
                                {/* Language Label */}
                                <div className="w-36 flex-shrink-0 px-4 py-3 border-r border-border/50 flex items-center">
                                    <span className={`text-xs ${isSource ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                        {label}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 px-4 py-3">
                                    {isSource ? (
                                        <p className="text-sm">{value}</p>
                                    ) : isEditing ? (
                                        <textarea
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onBlur={handleCellSave}
                                            onKeyDown={handleKeyDown}
                                            className="w-full text-sm p-2 -m-2 border rounded-lg bg-background resize-none min-h-[60px] focus:ring-2 focus:ring-primary/20"
                                        />
                                    ) : (
                                        <div
                                            onClick={() => !isSource && handleCellClick(row.id, lang, value)}
                                            className={`text-sm min-h-[20px] cursor-text ${isEmpty ? 'text-orange-500 dark:text-orange-400' : ''
                                                }`}
                                        >
                                            {value || 'Empty'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div
                            key={row.id}
                            className={`rounded-xl border overflow-hidden transition-all duration-200 ${isSelected
                                ? 'border-primary/40 ring-1 ring-primary/20'
                                : isTranslating
                                    ? 'border-violet-300 dark:border-violet-700'
                                    : isError
                                        ? 'border-red-300 dark:border-red-700'
                                        : 'border-border hover:border-border/80'
                                }`}
                        >
                            {/* Key Header Row */}
                            <div className={`flex items-center gap-3 px-4 py-3 ${isSelected ? 'bg-primary/5' : 'bg-card'
                                }`}>
                                <button
                                    onClick={() => toggleRowSelection(id, row.id)}
                                    className="p-0.5 hover:bg-muted rounded flex-shrink-0"
                                >
                                    {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-primary" />
                                    ) : (
                                        <Square className="w-4 h-4 text-muted-foreground" />
                                    )}
                                </button>

                                <span className="text-sm font-medium text-muted-foreground flex-1 truncate">
                                    {row.key || row.id}
                                </span>

                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className={`text-xs ${statusColors[row.status] || statusColors.pending}`}>
                                        {isTranslating && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                        {isError && <AlertCircle className="w-3 h-3 mr-1" />}
                                        {statusLabels[row.status] || 'Pending'}
                                    </Badge>
                                    {row.templateUsed && (
                                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                            via {row.templateUsed}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stacked Language Rows */}
                            <div className="bg-card">
                                <LanguageRow
                                    lang="en"
                                    label="English"
                                    value={row.en || row.source}
                                    isSource={true}
                                />
                                <LanguageRow
                                    lang="zh"
                                    label="Chinese Simplified (China)"
                                    value={row.zh}
                                />
                                <LanguageRow
                                    lang="my"
                                    label="Malay (Malaysia)"
                                    value={row.my}
                                />
                            </div>
                        </div>
                    )
                })}

                {/* Empty State */}
                {rows.length === 0 && (
                    <div className="py-20 text-center rounded-2xl border-2 border-dashed border-border">
                        <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileSpreadsheet className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-2">No translation content yet</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            Import an Excel file to add content for translation, or add rows manually.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-sm text-muted-foreground">
                Last updated: {project.lastUpdated || 'Recently'}
            </div>

            {/* Click outside to close dropdown */}
            {showTemplateDropdown && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowTemplateDropdown(false)}
                />
            )}

            {/* Add Row Modal */}
            {showAddRowModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold">Add Translation Row</h2>
                            <button
                                onClick={() => setShowAddRowModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">English Source Text</label>
                                <textarea
                                    placeholder="Enter the English text to translate..."
                                    value={newRowText}
                                    onChange={(e) => setNewRowText(e.target.value)}
                                    className="w-full min-h-[100px] p-3 rounded-xl border bg-background resize-none focus:ring-2 focus:ring-primary/20"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowAddRowModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={handleAddRow}
                                    disabled={!newRowText.trim()}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Row
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
