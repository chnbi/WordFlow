import { useState, useEffect, useRef } from "react"
import { FileSpreadsheet, Languages, Download, CheckCircle, Clock, Sparkles, ArrowLeft, ChevronDown, Square, CheckSquare, Loader2, AlertCircle, X, Upload, Plus, Table, List, Trash2, Check, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProjects } from "@/context/ProjectContext"
import { usePrompts } from "@/context/PromptContext"
import { useAuth, ACTIONS } from "@/App"
import * as XLSX from "xlsx"
import { parseExcelFile } from "@/lib/excel"
import { InlineRow, TableRow } from "@/components/project"

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
        getProjectPages,
        getPageRows,
        getSelectedPageId,
        selectPage,
        addProjectPage,
        addPageRows,
        getSelectedRowIds,
        toggleRowSelection,
        selectAllRows,
        deselectAllRows,
        selectRowsByStatus,
        translateSelectedRows,
        cancelTranslationQueue,
        isProcessing,
        queueProgress,
        deleteRows,
    } = useProjects()

    const { templates } = usePrompts()
    const { canDo } = useAuth()

    const [activeTab, setActiveTab] = useState("translation") // "translation" or "review"
    const [viewMode, setViewMode] = useState("inline") // "inline" or "table"
    const [editingCell, setEditingCell] = useState(null)
    const [editValue, setEditValue] = useState("")
    const [showTemplateDropdown, setShowTemplateDropdown] = useState(false)
    const [showAddRowModal, setShowAddRowModal] = useState(false)
    const [newRowText, setNewRowText] = useState("")
    const [isImporting, setIsImporting] = useState(false)
    const [statusFilter, setStatusFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")

    const fileInputRef = useRef(null)

    const id = projectId || window.location.hash.split('/')[1]
    const project = getProject(id)

    const pages = getProjectPages(id)
    const currentPageId = getSelectedPageId(id)
    const legacyRows = getProjectRows(id)

    const allRows = pages.length > 0 && currentPageId
        ? getPageRows(id, currentPageId)
        : legacyRows

    // Apply filters
    const rows = allRows.filter(row => {
        const matchesStatus = statusFilter === "all" || row.status === statusFilter
        const matchesSearch = !searchQuery ||
            (row.en || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (row.my || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (row.zh || '').toLowerCase().includes(searchQuery.toLowerCase())
        return matchesStatus && matchesSearch
    })

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

    // Calculate stats
    const totalRows = allRows.length
    const translatedRows = allRows.filter(r => r.my && r.zh).length
    const pendingReview = allRows.filter(r => r.status === 'review').length
    const progress = totalRows > 0 ? Math.round((translatedRows / totalRows) * 100) : 0

    // Handlers
    const handleCellClick = (rowId, field, currentValue) => {
        setEditingCell({ rowId, field })
        setEditValue(currentValue || "")
    }

    const handleCellSave = () => {
        if (!editingCell) return
        const row = allRows.find(r => r.id === editingCell.rowId)
        if (row) {
            const updates = { [editingCell.field]: editValue }
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

    const handleTranslateWithTemplate = (template) => {
        translateSelectedRows(id, template)
        setShowTemplateDropdown(false)
    }

    const handleSelectAll = () => {
        if (selectedCount === rows.length) {
            deselectAllRows(id)
        } else {
            selectAllRows(id)
        }
    }

    const handleExport = () => {
        const exportData = allRows.map(row => ({
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

    const handleImportSheet = async (event) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsImporting(true)
        try {
            // Use robust parsing from lib
            const parsedData = await parseExcelFile(file)
            let totalRows = 0

            for (const [sheetName, sheetData] of Object.entries(parsedData)) {
                // Map to project internal format
                const newRows = sheetData.entries.map((entry, idx) => ({
                    key: `row_${Date.now()}_${idx}`,
                    en: entry.english || '',
                    my: entry.malay || '',
                    zh: entry.chinese || '',
                    status: 'pending',
                    source: entry.english || '' // Backup source
                })).filter(row => row.en) // Only keep rows with source text

                if (newRows.length > 0) {
                    if (typeof addProjectPage === 'function') {
                        await addProjectPage(id, { name: sheetName }, newRows)
                    } else {
                        await addProjectRows(id, newRows)
                    }
                    totalRows += newRows.length
                }
            }
        } catch (error) {
            console.error('Error importing file:', error)
        } finally {
            setIsImporting(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleAddRow = async () => {
        if (!newRowText.trim()) return
        const newRow = {
            key: `row_${Date.now()}`,
            en: newRowText.trim(),
            my: '',
            zh: '',
            status: 'pending',
        }
        // Use page-specific add if project has pages, otherwise use legacy
        if (pages.length > 0 && currentPageId) {
            await addPageRows(id, currentPageId, [newRow])
        } else {
            await addProjectRows(id, [newRow])
        }
        setNewRowText('')
        setShowAddRowModal(false)
    }

    // Approve selected rows (mark as completed)
    const handleApproveSelected = () => {
        selectedRowIds.forEach(rowId => {
            updateProjectRow(id, rowId, { status: 'completed' })
        })
        deselectAllRows(id)
    }

    // Reject selected rows (mark as pending)
    const handleRejectSelected = () => {
        selectedRowIds.forEach(rowId => {
            updateProjectRow(id, rowId, { status: 'pending' })
        })
        deselectAllRows(id)
    }

    // Delete selected rows
    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedRowIds.size} row(s)? This action cannot be undone.`)) {
            return
        }
        await deleteRows(id, Array.from(selectedRowIds))
    }

    // Get review items (rows with status 'review')
    const reviewItems = allRows.filter(r => r.status === 'review')

    return (
        <div className="space-y-6 w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportSheet}
                accept=".xlsx,.xls,.csv"
                className="hidden"
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {project.sourceLanguage} → {project.targetLanguages?.join(", ")}
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {pages.length > 0 && (
                        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
                            {pages.map((page) => (
                                <button
                                    key={page.id}
                                    onClick={() => selectPage(id, page.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${currentPageId === page.id
                                        ? 'bg-card text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {page.name}
                                </button>
                            ))}
                        </div>
                    )}
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowAddRowModal(true)}>
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport}>
                        <Download className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl p-4 bg-card border">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <FileSpreadsheet className="w-3.5 h-3.5" /> Total
                    </div>
                    <span className="text-2xl font-light">{totalRows}</span>
                </div>
                <div className="rounded-xl p-4 bg-card border">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Translated
                    </div>
                    <span className="text-2xl font-light">{translatedRows}</span>
                </div>
                <div className="rounded-xl p-4 bg-card border">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Clock className="w-3.5 h-3.5" /> Review
                    </div>
                    <span className="text-2xl font-light">{pendingReview}</span>
                </div>
                <div className="rounded-xl p-4 bg-card border">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                        <Languages className="w-3.5 h-3.5" /> Progress
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-light">{progress}%</span>
                        <Progress value={progress} className="flex-1 h-1.5" />
                    </div>
                </div>
            </div>

            {/* View Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
                <TabsList className="grid w-full grid-cols-2 h-9 p-1 rounded-lg">
                    <TabsTrigger value="translation" className="rounded-md text-xs gap-1.5">
                        <Languages className="w-3.5 h-3.5" /> Translation
                    </TabsTrigger>
                    <TabsTrigger value="review" className="rounded-md text-xs gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Review
                        {reviewItems.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-medium">
                                {reviewItems.length}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Selection Toolbar */}
            {selectedCount > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-sm font-medium">{selectedCount} selected</span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => deselectAllRows(id)}>Clear</Button>

                        <div className="h-4 w-px bg-border/50 mx-2" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={handleDeleteSelected}
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" /> Delete
                        </Button>

                        <div className="h-4 w-px bg-border/50 mx-2" />

                        {/* Review Actions (only in review mode for managers+) */}
                        {activeTab === "review" && canDo(ACTIONS.APPROVE_TRANSLATION) && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={handleApproveSelected}
                                >
                                    <Check className="w-4 h-4" /> Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleRejectSelected}
                                >
                                    <XCircle className="w-4 h-4" /> Reject
                                </Button>
                            </>
                        )}

                        {/* Translation Actions (only in translation mode) */}
                        {activeTab === "translation" && (
                            <div className="relative">
                                <Button
                                    size="sm"
                                    className="rounded-xl gap-2"
                                    onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Translating {queueProgress.current}/{queueProgress.total}...</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4" /> Translate</>
                                    )}
                                </Button>
                                {showTemplateDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-popover border rounded-xl shadow-lg z-50 p-2">
                                        <p className="text-xs text-muted-foreground px-2 py-1 mb-1">Select Prompt</p>
                                        {templates.map(template => (
                                            <button
                                                key={template.id}
                                                onClick={() => handleTranslateWithTemplate(template)}
                                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-sm"
                                            >
                                                {template.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Queue Progress */}
            {isProcessing && queueProgress.total > 0 && (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                    <Loader2 className="w-5 h-5 animate-spin text-violet-600 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-medium">Batch {queueProgress.current + 1}/{queueProgress.total}</p>
                        <Progress value={(queueProgress.current / queueProgress.total) * 100} className="h-1.5 mt-1" />
                    </div>
                    <Button variant="ghost" size="sm" onClick={cancelTranslationQueue}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        {selectedCount === rows.length && rows.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                            <Square className="w-4 h-4" />
                        )}
                        Select all
                    </button>
                    <span className="text-xs text-muted-foreground">({rows.length} items)</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-8 px-3 rounded-lg border bg-background text-sm"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="review">Review</option>
                        <option value="error">Error</option>
                    </select>

                    {/* Search */}
                    <div className="relative">
                        <Input
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 w-40 pl-3 pr-8 rounded-lg text-sm"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
                        <button
                            onClick={() => setViewMode("inline")}
                            className={`p-1.5 rounded-md ${viewMode === "inline" ? "bg-card shadow-sm" : ""}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-1.5 rounded-md ${viewMode === "table" ? "bg-card shadow-sm" : ""}`}
                        >
                            <Table className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === "inline" ? (
                <div className="space-y-2">
                    {rows.map(row => (
                        <InlineRow
                            key={row.id}
                            row={row}
                            isSelected={selectedRowIds.has(row.id)}
                            editingCell={editingCell}
                            editValue={editValue}
                            onToggleSelection={() => toggleRowSelection(id, row.id)}
                            onCellClick={handleCellClick}
                            onEditChange={setEditValue}
                            onCellSave={handleCellSave}
                            onKeyDown={handleKeyDown}
                        />
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr className="border-b">
                                <th className="p-3 w-10"></th>
                                <th className="p-3 text-left text-xs font-medium text-muted-foreground">Source (EN)</th>
                                <th className="p-3 text-left text-xs font-medium text-muted-foreground">🇨🇳 Chinese</th>
                                <th className="p-3 text-left text-xs font-medium text-muted-foreground">🇲🇾 Malay</th>
                                <th className="p-3 text-left text-xs font-medium text-muted-foreground w-28">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map(row => (
                                <TableRow
                                    key={row.id}
                                    row={row}
                                    isSelected={selectedRowIds.has(row.id)}
                                    editingCell={editingCell}
                                    editValue={editValue}
                                    onToggleSelection={() => toggleRowSelection(id, row.id)}
                                    onCellClick={handleCellClick}
                                    onEditChange={setEditValue}
                                    onCellSave={handleCellSave}
                                    onKeyDown={handleKeyDown}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {rows.length === 0 && (
                <div className="py-16 text-center rounded-2xl border-2 border-dashed">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileSpreadsheet className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">No content found</h3>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                        {statusFilter !== "all" || searchQuery
                            ? "Try adjusting your filters or search query."
                            : "Import an Excel file to add content."}
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="text-sm text-muted-foreground">
                Last updated: {project.lastUpdated || 'Recently'}
            </div>

            {/* Dropdowns backdrop */}
            {showTemplateDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowTemplateDropdown(false)} />
            )}

            {/* Add Row Modal */}
            {showAddRowModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-5 border-b">
                            <h2 className="text-lg font-semibold">Add Translation Row</h2>
                            <button onClick={() => setShowAddRowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">English Source Text</label>
                                <textarea
                                    placeholder="Enter the English text..."
                                    value={newRowText}
                                    onChange={(e) => setNewRowText(e.target.value)}
                                    className="w-full min-h-[100px] p-3 rounded-xl border bg-background resize-none"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setShowAddRowModal(false)}>
                                    Cancel
                                </Button>
                                <Button className="flex-1" onClick={handleAddRow} disabled={!newRowText.trim()}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Row
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
