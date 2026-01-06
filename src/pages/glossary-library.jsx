// Glossary - Manage translation terms with status workflow
import { useState } from "react"
import { Plus, Search, Download, Filter, ArrowUpDown, CheckCircle2, Clock, XCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { GlossaryTermDialog } from "@/components/dialogs"
import { useAuth, ACTIONS } from "@/App"
import { useGlossary } from "@/context/GlossaryContext"
import * as XLSX from "xlsx"
import ImportGlossaryDialog from "@/components/dialogs/ImportGlossaryDialog"
import { toast } from "sonner"
import { Upload } from "lucide-react"



// Hardcoded category colors removed in favor of dynamic colors from context
// const categoryColors = { ... }

const statusConfig = {
    draft: { icon: Clock, label: "Draft", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
    approved: { icon: CheckCircle2, label: "Approved", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
    deprecated: { icon: XCircle, label: "Deprecated", color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30" },
}

// Hardcoded categories removed
// const categories = ["All", "UI", "General", ... ]

export default function Glossary() {
    const { canDo } = useAuth()
    const { terms, addTerm, addTerms, updateTerm, deleteTerm, deleteTerms, categories: dynamicCategories } = useGlossary()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")
    const [selectedIds, setSelectedIds] = useState([])
    const [sortField, setSortField] = useState("dateModified")
    const [sortDirection, setSortDirection] = useState("desc")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTerm, setEditingTerm] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)
    const [isImportOpen, setIsImportOpen] = useState(false)

    // Filter and sort logic
    const filteredTerms = terms
        .filter(term => {
            const matchesSearch =
                term.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
                term.malay.toLowerCase().includes(searchQuery.toLowerCase()) ||
                term.chinese.includes(searchQuery)

            if (activeCategory === "All") return matchesSearch
            return matchesSearch && term.category === activeCategory
        })
        .sort((a, b) => {
            // Handle date sorting specially (for "Just now" and date strings)
            if (sortField === "dateModified") {
                // "Just now" always comes first when sorting desc
                if (a.dateModified === "Just now") return sortDirection === "desc" ? -1 : 1
                if (b.dateModified === "Just now") return sortDirection === "desc" ? 1 : -1
                // Otherwise compare by id (higher id = newer)
                return sortDirection === "desc" ? b.id - a.id : a.id - b.id
            }
            // Regular string comparison for other fields
            const aVal = a[sortField]?.toLowerCase?.() || a[sortField]
            const bVal = b[sortField]?.toLowerCase?.() || b[sortField]
            if (sortDirection === "asc") return aVal > bVal ? 1 : -1
            return aVal < bVal ? 1 : -1
        })

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            // Default direction based on field
            setSortDirection(field === "dateModified" ? "desc" : "asc")
        }
    }

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredTerms.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredTerms.map(t => t.id))
        }
    }

    const handleCreate = () => {
        setEditingTerm(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (term) => {
        setEditingTerm(term)
        setIsDialogOpen(true)
    }

    const handleSave = (data) => {
        if (editingTerm) {
            updateTerm(editingTerm.id, data)
        } else {
            addTerm(data)
        }
    }

    const handleDelete = (id) => {
        deleteTerm(id)
        setSelectedIds(selectedIds.filter(i => i !== id))
        setDeleteConfirm(null)
    }

    const handleBulkDelete = () => {
        deleteTerms(selectedIds)
        setSelectedIds([])
        setBulkDeleteConfirm(false)
    }

    // Export to Excel
    const handleExport = () => {
        const exportData = terms.map(t => ({
            'English': t.english,
            'Bahasa Malaysia': t.malay,
            '中文': t.chinese,
            'Category': t.category,
            'Status': t.status,
            'Remark': t.remark || ''
        }))
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Glossary")
        XLSX.writeFile(wb, "glossary_export.xlsx")
    }

    const handleImport = async (newTerms) => {
        try {
            await addTerms(newTerms)
            toast.success(`Successfully imported ${newTerms.length} terms`)
            setIsImportOpen(false)
        } catch (error) {
            console.error('Import failed:', error)
            toast.error("Failed to import terms")
        }
    }

    return (
        <TooltipProvider>
            <div className="space-y-6 w-full max-w-7xl mx-auto pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Glossary</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage translation terms across all languages.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {canDo(ACTIONS.EDIT_GLOSSARY) && (
                            <Button variant="outline" onClick={handleCreate}>
                                Update
                            </Button>
                        )}
                        {canDo(ACTIONS.CREATE_GLOSSARY) && (
                            <>
                                <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                                    <Upload className="w-4 h-4 mr-2" /> Import Excel
                                </Button>
                                <Button onClick={handleCreate}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Term
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Filter Tabs + Actions Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit overflow-x-auto max-w-[600px] scrollbar-none">
                        <button
                            onClick={() => setActiveCategory("All")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeCategory === "All"
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            All
                        </button>
                        {dynamicCategories.map(cat => (
                            <button
                                key={cat.id || cat.name || cat}
                                onClick={() => setActiveCategory(cat.name || cat)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeCategory === (cat.name || cat)
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {cat.name || cat}
                            </button>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                            <Filter className="w-4 h-4" /> Filter
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleSort("english")}>
                            <ArrowUpDown className="w-4 h-4" /> Sort
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
                            <Download className="w-4 h-4" /> Download
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search terms..."
                        className="pl-9 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-4 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                        <span className="text-sm font-medium">{selectedIds.length} selected</span>
                        <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirm(true)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete Selected
                        </Button>
                    </div>
                )}

                {/* Table Card */}
                <div className="rounded-2xl bg-card shadow-card overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-muted/30 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <div className="col-span-1 flex items-center">
                            <button
                                onClick={toggleSelectAll}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.length === filteredTerms.length && filteredTerms.length > 0
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : "border-muted-foreground/30 hover:border-muted-foreground"
                                    }`}
                            >
                                {selectedIds.length === filteredTerms.length && filteredTerms.length > 0 && (
                                    <Check className="w-3 h-3" />
                                )}
                            </button>
                        </div>
                        <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => handleSort("english")}>
                            English
                            <ArrowUpDown className="w-3 h-3" />
                        </div>
                        <div className="col-span-2">Bahasa Malaysia</div>
                        <div className="col-span-2">中文</div>
                        <div className="col-span-1">Category</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2">Remark</div>
                        <div className="col-span-1">Action</div>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-border/50">
                        {filteredTerms.map((term) => {
                            const StatusIcon = statusConfig[term.status]?.icon || Clock
                            const isSelected = selectedIds.includes(term.id)
                            return (
                                <div
                                    key={term.id}
                                    className={`grid grid-cols-12 gap-4 px-6 py-3 items-center transition-colors text-[13px] ${isSelected ? "bg-primary/5" : "hover:bg-accent/30"
                                        }`}
                                >
                                    {/* Checkbox */}
                                    <div className="col-span-1">
                                        <button
                                            onClick={() => toggleSelect(term.id)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                ? "bg-primary border-primary text-primary-foreground"
                                                : "border-muted-foreground/30 hover:border-muted-foreground"
                                                }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </button>
                                    </div>

                                    {/* English */}
                                    <div className="col-span-2">
                                        <span className="font-medium text-foreground text-[13px]">{term.english}</span>
                                    </div>

                                    {/* Malay */}
                                    <div className="col-span-2 text-muted-foreground text-[13px]">
                                        {term.malay}
                                    </div>

                                    {/* Chinese */}
                                    <div className="col-span-2 text-muted-foreground text-[13px]">
                                        {term.chinese}
                                    </div>

                                    {/* Category */}
                                    <div className="col-span-1">
                                        {(() => {
                                            const catObj = dynamicCategories.find(c => (c.name || c) === term.category)
                                            const colorClass = catObj?.color || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                            return (
                                                <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
                                                    {term.category}
                                                </span>
                                            )
                                        })()}
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1">
                                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${statusConfig[term.status]?.bg} ${statusConfig[term.status]?.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusConfig[term.status]?.label}
                                        </span>
                                    </div>

                                    {/* Remark */}
                                    <div className="col-span-2">
                                        {term.remark ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <p className="text-sm text-muted-foreground truncate max-w-[140px] cursor-help">
                                                        {term.remark}
                                                    </p>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="max-w-xs">
                                                    {term.remark}
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <span className="text-muted-foreground/50">—</span>
                                        )}
                                    </div>

                                    {/* Inline Actions */}
                                    <div className="col-span-1 flex items-center gap-3">
                                        {canDo(ACTIONS.EDIT_GLOSSARY) && (
                                            <button
                                                onClick={() => handleEdit(term)}
                                                className="text-xs font-medium text-primary hover:underline"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        {canDo(ACTIONS.DELETE_GLOSSARY) && (
                                            <button
                                                onClick={() => setDeleteConfirm(term.id)}
                                                className="text-xs font-medium text-destructive hover:underline"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {/* Empty State */}
                        {filteredTerms.length === 0 && (
                            <div className="py-16 text-center">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold mb-1">No terms found</h3>
                                <p className="text-muted-foreground text-sm">
                                    {searchQuery ? `No results for "${searchQuery}"` : "Add your first term to get started."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Showing {filteredTerms.length} of {terms.length} terms</span>
                </div>

                <ImportGlossaryDialog
                    open={isImportOpen}
                    onOpenChange={setIsImportOpen}
                    onImport={handleImport}
                />

                <GlossaryTermDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    initialData={editingTerm}
                    onSave={handleSave}
                />

                {/* Delete Single Term Confirmation */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl">
                            <h3 className="text-lg font-semibold mb-2">Delete Term?</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                This action cannot be undone. The glossary term will be permanently deleted.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)}>
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Delete Confirmation */}
                {bulkDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl">
                            <h3 className="text-lg font-semibold mb-2">Delete {selectedIds.length} Terms?</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                This action cannot be undone. {selectedIds.length} glossary terms will be permanently deleted.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setBulkDeleteConfirm(false)}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleBulkDelete}>
                                    Delete All
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}
