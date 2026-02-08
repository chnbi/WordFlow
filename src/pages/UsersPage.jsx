import React, { useState, useEffect, useCallback } from "react"
import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Search,
    Filter,
    Plus,
    Download,
    ExternalLink,
    Check,
    Shield,
    MoreHorizontal
} from "lucide-react"
import { useAuth } from "@/App"
import { ROLES, getRoleLabel, getRoleColor } from "@/lib/permissions"
import { getUsers, updateUserRole } from "@/api/firebase"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import UserManagementDialog from "@/components/dialogs/UserManagementDialog" // Reuse for 'New User' modal logic if needed? 
// Actually, I'll build a simpler "New User" dialog or reuse the comprehensive management dialog as a "Create/Edit" modal if possible, 
// OR just implement the "New User" simple form. For now, let's stick to the READ view page.

export default function UsersPage() {
    const { user: currentUser, isManager } = useAuth()
    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const fetchUsers = useCallback(async () => {
        setIsLoading(true)
        try {
            const userData = await getUsers()
            // Transform for table
            const transformed = userData.map((u, index) => ({
                id: u.id,
                index: index + 1,
                active: true, // Mock 'active' status
                lastName: u.name ? u.name.split(' ').slice(1).join(' ') : '-',
                firstName: u.name ? u.name.split(' ')[0] : '-',
                username: u.username || u.email?.split('@')[0],
                email: u.email,
                role: u.role || ROLES.EDITOR,
                sourceLangs: '-',
                targetLangs: '-',
                clients: '-',
                domains: '-',
                subdomains: '-',
                workflow: '-',
                editorVersion: '-',
                jobs: 0,
                loginHistory: u.updated // Mock
            }))
            setUsers(transformed)
        } catch (error) {
            console.error(error)
            toast.error("Failed to load users")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    // Redirect Editors to Settings
    useEffect(() => {
        if (!isManager) {
            window.location.hash = '#settings'
        }
    }, [isManager])

    // Show nothing while redirecting
    if (!isManager) {
        return null
    }

    // Columns Configuration matching the screenshot
    const columns = [
        {
            header: "Active",
            accessor: "active",
            width: "60px",
            align: "center",
            render: (row) => row.active ? <Check className="w-4 h-4 text-green-600" /> : null
        },
        {
            header: "#",
            accessor: "index",
            width: "50px",
            align: "center",
            color: 'hsl(220, 9%, 46%)'
        },
        {
            header: "Last name",
            accessor: "lastName",
            width: "120px",
            sortable: true
        },
        {
            header: "First name",
            accessor: "firstName",
            width: "120px",
            sortable: true
        },
        {
            header: "Username",
            accessor: "username",
            width: "150px"
        },
        {
            header: "Email",
            accessor: "email",
            width: "220px"
        },
        {
            header: "Role",
            accessor: "role",
            width: "120px",
            render: (row) => (
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor(row.role)}`}>
                    {getRoleLabel(row.role)}
                </span>
            )
        },
        { header: "Source langs", accessor: "sourceLangs", width: "120px", align: "center" },
        { header: "Target langs", accessor: "targetLangs", width: "120px", align: "center" },
        { header: "Clients", accessor: "clients", width: "100px", align: "center" },
        { header: "Domains", accessor: "domains", width: "100px", align: "center" },
        { header: "Subdomains", accessor: "subdomains", width: "100px", align: "center" },
        { header: "Workflow", accessor: "workflow", width: "100px", align: "center" },
        { header: "Editor version", accessor: "editorVersion", width: "120px", align: "center" },
        { header: "Jobs", accessor: "jobs", width: "80px", align: "center" },
        {
            header: "Login history",
            accessor: "loginHistory",
            width: "100px",
            align: "center",
            render: () => <ExternalLink className="w-4 h-4 text-slate-400 cursor-pointer hover:text-primary" />
        }
    ]

    const filteredData = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName + ' ' + user.lastName).toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 max-w-[100vw] overflow-hidden flex flex-col h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="md:hidden">
                        {/* Mobile menu trigger if needed */}
                    </Button>
                    <h1 className="text-xl font-semibold text-foreground">
                        Users
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                        <Search className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400 flex items-center justify-center font-medium text-sm">
                        WX
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2 h-9 rounded-full px-4 border-border text-foreground hover:bg-muted">
                        <Filter className="w-4 h-4" />
                        Filter
                    </Button>
                    <Button className="gap-2 h-9 rounded-full px-4 bg-card border border-border text-foreground hover:bg-muted">
                        <Plus className="w-4 h-4" />
                        New user
                    </Button>
                    <Button variant="outline" className="gap-2 h-9 rounded-full px-4 border-border text-foreground hover:bg-muted">
                        <Download className="w-4 h-4" />
                        Import
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                        {filteredData.length} user{filteredData.length !== 1 && 's'}
                    </span>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card flex flex-col">
                <div className="flex-1 overflow-auto">
                    <DataTable
                        columns={columns}
                        data={filteredData}
                        onToggleSelect={(id) => { }}
                        onToggleSelectAll={() => { }}
                        scrollable={true}
                    />
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-border flex items-center justify-between bg-card">
                    <span className="text-xs text-muted-foreground">
                        Showing 1-{filteredData.length} of {filteredData.length} results
                    </span>
                    <div className="flex items-center gap-4">
                        {/* Simple Pagination Mock */}
                        <div className="flex items-center bg-muted rounded-lg p-1">
                            <Button variant="ghost" size="icon" disabled className="h-6 w-8 rounded-md text-muted-foreground">{'<'}</Button>
                            <div className="px-3 text-xs font-medium text-foreground">1</div>
                            <Button variant="ghost" size="icon" disabled className="h-6 w-8 rounded-md text-muted-foreground">{'>'}</Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>25</span>
                        <span>Per page</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
