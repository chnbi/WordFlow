// Submissions - Editor's view of rows sent for review
import { useState, useEffect } from 'react'
import { useAuth } from '@/App'
import { Clock, CheckCircle2, XCircle, FileText, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageContainer, Card } from '@/components/ui/shared'
import { PageHeader } from '@/components/ui/common'
import { getUserSubmissions } from '@/api/firebase'
import { toast } from 'sonner'
import Pagination from '@/components/Pagination'
import { useApprovalNotifications } from "@/hooks/useApprovalNotifications"

export default function Submissions() {
    const { user, isManager } = useAuth()
    const { markAsViewed } = useApprovalNotifications()
    const [allSubmissions, setAllSubmissions] = useState([]) // Raw data for stats
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all') // all, review, approved, rejected

    // Redirect Managers to Approvals (or Home)
    useEffect(() => {
        if (isManager) {
            window.location.hash = '#approvals'
        }
    }, [isManager])

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(25)

    // Reset to page 1 when filter changes
    useEffect(() => {
        setCurrentPage(1)
    }, [statusFilter])

    // Mark as viewed on mount
    useEffect(() => {
        markAsViewed('submissions', 'main')
    }, [])

    useEffect(() => {
        loadSubmissions()
    }, [user]) // Only reload on user change, not on filter change

    // Filter logic (Client-side)
    const filteredSubmissions = allSubmissions.filter(item => {
        if (statusFilter === 'all') return true
        if (statusFilter === 'rejected') return item.status === 'changes' // Map rejected -> changes
        return item.status === statusFilter
    })

    // Paginate submissions
    const totalItems = filteredSubmissions.length
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex)

    const loadSubmissions = async () => {
        if (!user) return

        setIsLoading(true)
        try {
            // Get all rows submitted by this user (status = review, approved, or changes)
            // Uses Firestore Collection Group Query
            const records = await getUserSubmissions(user.id)

            // Store all records
            setAllSubmissions(records)
        } catch (error) {
            console.error('Error loading submissions:', error)
            toast.error('Failed to load submissions')
        } finally {
            setIsLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'review':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Review
                    </span>
                )
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                    </span>
                )
            case 'changes':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                        <XCircle className="w-3.5 h-3.5" />
                        Rejected
                    </span>
                )
            default:
                return null
        }
    }

    const stats = {
        pending: allSubmissions.filter(s => s.status === 'review').length,
        approved: allSubmissions.filter(s => s.status === 'approved').length,
        rejected: allSubmissions.filter(s => s.status === 'changes').length
    }

    return (
        <PageContainer>
            {/* Header */}
            <PageHeader description="Track rows you've sent for review">
                My Submissions
            </PageHeader>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Pending</p>
                            <p className="text-2xl font-bold text-amber-900 dark:text-amber-300 mt-1">{stats.pending}</p>
                        </div>
                        <Clock className="w-8 h-8 text-amber-400 dark:text-amber-600" />
                    </div>
                </div>

                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Approved</p>
                            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300 mt-1">{stats.approved}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 dark:text-emerald-600" />
                    </div>
                </div>

                <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Rejected</p>
                            <p className="text-2xl font-bold text-rose-900 dark:text-rose-300 mt-1">{stats.rejected}</p>
                        </div>
                        <XCircle className="w-8 h-8 text-rose-400 dark:text-rose-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('all')}
                >
                    All
                </Button>
                <Button
                    variant={statusFilter === 'review' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('review')}
                >
                    Pending
                </Button>
                <Button
                    variant={statusFilter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('approved')}
                >
                    Approved
                </Button>
                <Button
                    variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('rejected')}
                >
                    Rejected
                </Button>
            </div>

            {/* Submissions List */}
            <div>
                {isLoading ? (
                    <Card className="p-8 text-center text-zinc-500">Loading submissions...</Card>
                ) : paginatedSubmissions.length === 0 ? (
                    <Card className="p-8 text-center">
                        <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                        <p className="text-zinc-500">No submissions found</p>
                        <p className="text-sm text-zinc-400 mt-1">
                            {statusFilter === 'all'
                                ? 'Submit rows for review to see them here'
                                : `No ${statusFilter} submissions`
                            }
                        </p>
                    </Card>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {paginatedSubmissions.map((row) => (
                                <Card key={row.id} className="p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Project/Page Info */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                                                    {row.expand?.project?.name || 'Unknown Project'}
                                                </span>
                                                {row.expand?.page && (
                                                    <>
                                                        <span className="text-zinc-300">/</span>
                                                        <span className="text-xs text-zinc-500">
                                                            {row.expand.page.name}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            {/* Row Content */}
                                            <div className="space-y-2 mt-2">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                    <div className="text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                                                        <span className="text-xs text-slate-400 block mb-0.5">English</span>
                                                        <span className="text-zinc-900 dark:text-zinc-100">{row.en || '—'}</span>
                                                    </div>
                                                    <div className="text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                                                        <span className="text-xs text-slate-400 block mb-0.5">Malay</span>
                                                        <span className="text-zinc-600 dark:text-zinc-400">{row.my || '—'}</span>
                                                    </div>
                                                    <div className="text-sm border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                                                        <span className="text-xs text-slate-400 block mb-0.5">Chinese</span>
                                                        <span className="text-zinc-600 dark:text-zinc-400">{row.zh || '—'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timestamp */}
                                            <p className="text-xs text-zinc-400 mt-3 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Updated {new Date(row.updatedAt?.toDate?.() || row.updatedAt || row.updated).toLocaleString()}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                            {getStatusBadge(row.status)}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-6">
                            <Pagination
                                currentPage={currentPage}
                                totalItems={totalItems}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </div>
                    </>
                )}
            </div>
        </PageContainer>
    )
}
