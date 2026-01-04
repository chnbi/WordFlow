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
import GlossaryTermDialog from "@/components/glossary-term-dialog"
import { useAuth, ACTIONS } from "@/App"
import { useGlossary } from "@/context/GlossaryContext"
import * as XLSX from "xlsx"

// Enhanced mock data
const initialGlossaryData = [
    {
        id: 1,
        english: "Dashboard",
        malay: "Papan Pemuka",
        chinese: "仪表板",
        category: "UI",
        status: "approved",
        remark: "Standard UI term. Do not use '控制面板'.",
        dateModified: "Jan 1, 2025",
    },
    {
        id: 2,
        english: "Settings",
        malay: "Tetapan",
        chinese: "设置",
        category: "UI",
        status: "approved",
        remark: "",
        dateModified: "Dec 30, 2024",
    },
    {
        id: 3,
        english: "Submit",
        malay: "Hantar",
        chinese: "提交",
        category: "Actions",
        status: "approved",
        remark: "For form buttons. Use '发送' only for messaging.",
        dateModified: "Dec 28, 2024",
    },
    {
        id: 4,
        english: "Privacy Policy",
        malay: "Dasar Privasi",
        chinese: "隐私政策",
        category: "Legal",
        status: "draft",
        remark: "Awaiting legal review",
        dateModified: "Dec 27, 2024",
    },
    {
        id: 5,
        english: "User Account",
        malay: "Akaun Pengguna",
        chinese: "用户账户",
        category: "Account",
        status: "deprecated",
        remark: "Replaced by 'My Profile'",
        dateModified: "Dec 20, 2024",
    },
    {
        id: 6,
        english: "Sign In",
        malay: "Log Masuk",
        chinese: "登录",
        category: "Account",
        status: "approved",
        remark: "Use for login buttons",
        dateModified: "Dec 18, 2024",
    },
    {
        id: 7,
        english: "Sign Out",
        malay: "Log Keluar",
        chinese: "退出登录",
        category: "Account",
        status: "approved",
        remark: "",
        dateModified: "Dec 18, 2024",
    },
    {
        id: 8,
        english: "Cancel",
        malay: "Batal",
        chinese: "取消",
        category: "Actions",
        status: "approved",
        remark: "",
        dateModified: "Dec 15, 2024",
    },
    {
        id: 9,
        english: "Confirm",
        malay: "Sahkan",
        chinese: "确认",
        category: "Actions",
        status: "approved",
        remark: "Use in confirmation dialogs",
        dateModified: "Dec 15, 2024",
    },
    {
        id: 10,
        english: "Delete",
        malay: "Padam",
        chinese: "删除",
        category: "Actions",
        status: "approved",
        remark: "Use carefully - destructive action",
        dateModified: "Dec 14, 2024",
    },
    {
        id: 11,
        english: "Edit",
        malay: "Sunting",
        chinese: "编辑",
        category: "Actions",
        status: "approved",
        remark: "",
        dateModified: "Dec 14, 2024",
    },
    {
        id: 12,
        english: "Save",
        malay: "Simpan",
        chinese: "保存",
        category: "Actions",
        status: "approved",
        remark: "",
        dateModified: "Dec 14, 2024",
    },
    {
        id: 13,
        english: "Download",
        malay: "Muat Turun",
        chinese: "下载",
        category: "Actions",
        status: "approved",
        remark: "",
        dateModified: "Dec 12, 2024",
    },
    {
        id: 14,
        english: "Upload",
        malay: "Muat Naik",
        chinese: "上传",
        category: "Actions",
        status: "approved",
        remark: "",
        dateModified: "Dec 12, 2024",
    },
    {
        id: 15,
        english: "Notifications",
        malay: "Pemberitahuan",
        chinese: "通知",
        category: "UI",
        status: "approved",
        remark: "",
        dateModified: "Dec 10, 2024",
    },
    {
        id: 16,
        english: "Profile",
        malay: "Profil",
        chinese: "个人资料",
        category: "Account",
        status: "approved",
        remark: "Use instead of 'User Account'",
        dateModified: "Dec 10, 2024",
    },
    {
        id: 17,
        english: "Home",
        malay: "Laman Utama",
        chinese: "首页",
        category: "UI",
        status: "approved",
        remark: "",
        dateModified: "Dec 8, 2024",
    },
    {
        id: 18,
        english: "Terms of Service",
        malay: "Terma Perkhidmatan",
        chinese: "服务条款",
        category: "Legal",
        status: "draft",
        remark: "Pending legal approval",
        dateModified: "Dec 5, 2024",
    },
    {
        id: 19,
        english: "Data Protection",
        malay: "Perlindungan Data",
        chinese: "数据保护",
        category: "Legal",
        status: "draft",
        remark: "",
        dateModified: "Dec 5, 2024",
    },
    {
        id: 20,
        english: "Get Started",
        malay: "Mulakan",
        chinese: "开始使用",
        category: "Marketing",
        status: "approved",
        remark: "CTA button text",
        dateModified: "Dec 3, 2024",
    },
    {
        id: 21,
        english: "Learn More",
        malay: "Ketahui Lebih Lanjut",
        chinese: "了解更多",
        category: "Marketing",
        status: "approved",
        remark: "",
        dateModified: "Dec 3, 2024",
    },
    {
        id: 22,
        english: "API Key",
        malay: "Kunci API",
        chinese: "API密钥",
        category: "Technical",
        status: "approved",
        remark: "",
        dateModified: "Dec 1, 2024",
    },
    {
        id: 23,
        english: "Webhook",
        malay: "Webhook",
        chinese: "Webhook",
        category: "Technical",
        status: "approved",
        remark: "Keep as-is in all languages",
        dateModified: "Dec 1, 2024",
    },
    {
        id: 24,
        english: "Search",
        malay: "Cari",
        chinese: "搜索",
        category: "UI",
        status: "approved",
        remark: "",
        dateModified: "Nov 28, 2024",
    },
    {
        id: 25,
        english: "Filter",
        malay: "Tapis",
        chinese: "筛选",
        category: "UI",
        status: "approved",
        remark: "",
        dateModified: "Nov 28, 2024",
    },
]

const categoryColors = {
    "UI": "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    "General": "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Account": "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    "Actions": "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    "Legal": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    "Marketing": "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    "Technical": "bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400",
}

const statusConfig = {
    draft: { icon: Clock, label: "Draft", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" },
    approved: { icon: CheckCircle2, label: "Approved", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
    deprecated: { icon: XCircle, label: "Deprecated", color: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30" },
}

const categories = ["All", "UI", "General", "Account", "Actions", "Legal", "Marketing", "Technical"]

export default function Glossary() {
    const { canDo } = useAuth()
    const { terms, addTerm, updateTerm, deleteTerm, deleteTerms } = useGlossary()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")
    const [selectedIds, setSelectedIds] = useState([])
    const [sortField, setSortField] = useState("dateModified")
    const [sortDirection, setSortDirection] = useState("desc")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTerm, setEditingTerm] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

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
                            <Button onClick={handleCreate}>
                                <Plus className="w-4 h-4 mr-2" /> Add Term
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Tabs + Actions Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Category Tabs */}
                    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeCategory === cat
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {cat}
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
                                        <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${categoryColors[term.category] || categoryColors["General"]}`}>
                                            {term.category}
                                        </span>
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
