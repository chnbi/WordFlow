// Prompt Library - Redesigned with status workflow and use-case categories
import { useState, useRef, useEffect } from "react"
import { Search, Plus, Filter, Copy, MoreHorizontal, Clock, CheckCircle2, Eye, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PromptDetailDialog } from "@/components/dialogs"
import { usePrompts } from "@/context/PromptContext"
import { useAuth, ACTIONS } from "@/App"

// Use-case based categories for translation prompts
const CATEGORIES = {
    'banner': { label: 'Banner Slogan', color: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' },
    'button': { label: 'Button Text', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    'features': { label: 'Features', color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
    'narratives': { label: 'Narratives', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    'news': { label: 'News', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    'legal': { label: 'Legal', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    'social': { label: 'Social Media', color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
    'technical': { label: 'Technical', color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
}

// Status workflow configuration
const STATUS_CONFIG = {
    draft: { label: 'Draft', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    review: { label: 'In Review', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    published: { label: 'Published', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
}

// Sort options
const SORT_OPTIONS = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'status', label: 'By Status' },
]

export default function PromptLibrary() {
    const { templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = usePrompts()
    const { canDo } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeStatus, setActiveStatus] = useState("all")
    const [activeCategory, setActiveCategory] = useState("all")
    const [sortBy, setSortBy] = useState("date-desc")
    const [showFilterMenu, setShowFilterMenu] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [toastMessage, setToastMessage] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [openMenu, setOpenMenu] = useState(null)
    const [expandedId, setExpandedId] = useState(null)
    const filterRef = useRef(null)

    // Close filter menu on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilterMenu(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Ensure all templates have status
    const templatesWithDefaults = templates.map(t => ({
        ...t,
        status: t.status || 'draft',
        category: t.category || 'narratives'
    }))

    // Calculate counts per status
    const statusCounts = {
        all: templatesWithDefaults.length,
        draft: templatesWithDefaults.filter(t => t.status === 'draft').length,
        review: templatesWithDefaults.filter(t => t.status === 'review').length,
        published: templatesWithDefaults.filter(t => t.status === 'published').length,
    }

    // Filter Logic
    const filteredTemplates = templatesWithDefaults
        .filter(template => {
            const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.prompt?.toLowerCase().includes(searchQuery.toLowerCase())

            const matchesStatus = activeStatus === "all" || template.status === activeStatus
            const matchesCategory = activeCategory === "all" || template.category === activeCategory

            return matchesSearch && matchesStatus && matchesCategory
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '')
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '')
                case 'date-asc':
                    return (a.id || 0) - (b.id || 0)
                case 'date-desc':
                    return (b.id || 0) - (a.id || 0)
                case 'status':
                    const order = { published: 0, review: 1, draft: 2 }
                    return (order[a.status] || 2) - (order[b.status] || 2)
                default:
                    return 0
            }
        })

    const handleCreate = () => {
        setEditingTemplate(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (template) => {
        setEditingTemplate(template)
        setIsDialogOpen(true)
        setOpenMenu(null)
    }

    const handleSave = (data) => {
        if (editingTemplate) {
            updateTemplate(editingTemplate.id, data)
        } else {
            addTemplate({ ...data, status: 'draft' })
        }
    }

    const handleDelete = (id) => {
        deleteTemplate(id)
        setDeleteConfirm(null)
        setOpenMenu(null)
    }

    const handleCopy = (template) => {
        navigator.clipboard.writeText(template.prompt)
        setToastMessage(`Prompt copied to clipboard!`)
        setTimeout(() => setToastMessage(null), 3000)
        setOpenMenu(null)
    }

    const handleDuplicate = (template) => {
        duplicateTemplate(template.id)
        setToastMessage(`Duplicated "${template.name}"`)
        setTimeout(() => setToastMessage(null), 3000)
        setOpenMenu(null)
    }

    const clearFilters = () => {
        setSearchQuery("")
        setActiveStatus("all")
        setActiveCategory("all")
        setSortBy("date-desc")
    }

    const hasActiveFilters = searchQuery || activeStatus !== "all" || activeCategory !== "all" || sortBy !== "date-desc"

    return (
        <div className="space-y-6 w-full max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Prompt Library</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage translation prompts for different use cases.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {canDo(ACTIONS.CREATE_PROMPT) && (
                        <Button onClick={handleCreate} className="rounded-xl shadow-sm">
                            <Plus className="w-4 h-4 mr-2" /> Add New
                        </Button>
                    )}
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
                    {['all', 'draft', 'review', 'published'].map(status => (
                        <button
                            key={status}
                            onClick={() => setActiveStatus(status)}
                            className={`px - 4 py - 2 text - sm font - medium rounded - lg transition - all flex items - center gap - 2 ${activeStatus === status
                                ? "bg-card text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                                } `}
                        >
                            {status === 'all' ? 'All' : STATUS_CONFIG[status].label}
                            <span className={`text - xs px - 1.5 py - 0.5 rounded - full ${activeStatus === status ? 'bg-primary/10 text-primary' : 'bg-muted'
                                } `}>
                                {statusCounts[status]}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Search + Filter + Sort */}
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search prompts..."
                            className="pl-9 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter & Sort Dropdown */}
                    <div className="relative" ref={filterRef}>
                        <Button
                            variant="outline"
                            size="sm"
                            className={`rounded - xl gap - 2 ${hasActiveFilters ? 'border-primary text-primary' : ''} `}
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                        >
                            <Filter className="w-4 h-4" /> Filter & Sort
                        </Button>

                        {showFilterMenu && (
                            <div className="absolute right-0 top-full mt-2 bg-card border rounded-xl shadow-lg p-4 w-72 z-20">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-semibold text-sm">Filter & Sort</span>
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-primary hover:underline"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>

                                {/* Sort By */}
                                <div className="mb-4">
                                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Sort By</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        {SORT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div className="mb-4">
                                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
                                    <select
                                        value={activeCategory}
                                        onChange={(e) => setActiveCategory(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="all">All Categories</option>
                                        {Object.entries(CATEGORIES).map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-2 block">Status</label>
                                    <select
                                        value={activeStatus}
                                        onChange={(e) => setActiveStatus(e.target.value)}
                                        className="w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="all">All Statuses</option>
                                        {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setActiveCategory("all")}
                    className={`px - 3 py - 1.5 text - sm font - medium rounded - full whitespace - nowrap transition - all ${activeCategory === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                        } `}
                >
                    All Categories
                </button>
                {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
                    <button
                        key={key}
                        onClick={() => setActiveCategory(key)}
                        className={`px - 3 py - 1.5 text - sm font - medium rounded - full whitespace - nowrap transition - all ${activeCategory === key
                            ? color
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            } `}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredTemplates.map(template => {
                    const StatusIcon = STATUS_CONFIG[template.status]?.icon || Clock
                    const categoryInfo = CATEGORIES[template.category] || { label: 'No Category', color: 'bg-muted text-muted-foreground' }

                    const isExpanded = expandedId === template.id

                    return (
                        <div
                            key={template.id}
                            className={`bg-card rounded-2xl border border-border/50 p-5 hover:shadow-md transition-all group relative cursor-pointer ${isExpanded ? 'ring-2 ring-primary/50' : ''}`}
                            onClick={(e) => {
                                // Don't expand if clicking on menu or buttons
                                if (e.target.closest('button')) return
                                setExpandedId(isExpanded ? null : template.id)
                            }}
                        >
                            {/* Category Tag */}
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text - xs font - medium px - 2.5 py - 1 rounded - full ${categoryInfo.color} `}>
                                    {categoryInfo.label}
                                </span>

                                {/* Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenMenu(openMenu === template.id ? null : template.id)}
                                        className="p-1.5 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </button>

                                    {openMenu === template.id && (
                                        <div className="absolute right-0 top-full mt-1 bg-card border rounded-xl shadow-lg py-1 w-40 z-10">
                                            <button
                                                onClick={() => handleCopy(template)}
                                                className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" /> Copy Prompt
                                            </button>
                                            {canDo(ACTIONS.EDIT_PROMPT) && (
                                                <button
                                                    onClick={() => handleEdit(template)}
                                                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2"
                                                >
                                                    <Pencil className="w-4 h-4" /> Edit
                                                </button>
                                            )}
                                            {canDo(ACTIONS.DELETE_PROMPT) && (
                                                <button
                                                    onClick={() => { setDeleteConfirm(template.id); setOpenMenu(null) }}
                                                    className="w-full px-3 py-2 text-sm text-left hover:bg-muted flex items-center gap-2 text-destructive"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="font-semibold text-foreground mb-2">{template.name}</h3>

                            {/* Preview Text */}
                            {isExpanded ? (
                                <div className="text-sm text-muted-foreground mb-4 space-y-2">
                                    <p className="whitespace-pre-wrap bg-muted/50 p-3 rounded-lg max-h-64 overflow-y-auto">
                                        {template.prompt}
                                    </p>
                                    <p className="text-xs text-muted-foreground/70">Click card to collapse</p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {template.prompt?.substring(0, 120)}...
                                </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                {/* Status */}
                                <span className={`inline - flex items - center gap - 1.5 text - xs font - medium px - 2 py - 1 rounded - full ${STATUS_CONFIG[template.status]?.bg} ${STATUS_CONFIG[template.status]?.color} `}>
                                    <StatusIcon className="w-3 h-3" />
                                    {STATUS_CONFIG[template.status]?.label}
                                </span>

                                {/* Copy Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(template)}
                                    className="rounded-lg text-xs h-8 gap-1.5"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                </Button>
                            </div>
                        </div>
                    )
                })}

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed rounded-2xl border-muted">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-1">No prompts found</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            {searchQuery ? `No results for "${searchQuery}"` : "Add your first prompt to get started."}
                        </p>
                        <Button variant="outline" onClick={() => { setSearchQuery(""); setActiveStatus("all"); setActiveCategory("all") }}>
                            Clear Filters
                        </Button>
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Showing {filteredTemplates.length} of {templatesWithDefaults.length} prompts</span>
            </div>

            <PromptDetailDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingTemplate}
                onSave={handleSave}
                categories={CATEGORIES}
            />

            {/* Toast */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {toastMessage}
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
                    <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-2">Delete Prompt?</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            This action cannot be undone. Projects using this prompt will be set to "No Category".
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
        </div>
    )
}
