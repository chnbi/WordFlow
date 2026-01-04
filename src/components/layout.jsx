// Layout component - wraps all pages with sidebar
import { AppSidebar } from "@/components/app-sidebar"
import { House, BookOpen, Library, Settings2, Folder, FileText, ChevronDown } from "lucide-react"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"
import { useAuth, ROLES, getRoleLabel, getRoleColor } from "@/App"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Icon mapping for breadcrumb items
const iconMap = {
    'Home': House,
    'Projects': Folder,
    'Glossary': BookOpen,
    'Prompt Library': Library,
    'Settings': Settings2,
    'Project': FileText,
}

export default function Layout({ children, breadcrumbs = [] }) {
    const { role, setRole } = useAuth()

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="bg-app-background">
                {/* Breadcrumb Header */}
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6">
                    <div className="flex items-center gap-1.5">
                        {breadcrumbs.map((crumb, index) => {
                            const Icon = iconMap[crumb.label]
                            const isLast = index === breadcrumbs.length - 1

                            return (
                                <span key={index} className="flex items-center gap-1.5">
                                    {index > 0 && (
                                        <span className="text-zinc-300 dark:text-zinc-600 mx-1">/</span>
                                    )}
                                    {crumb.href ? (
                                        <a
                                            href={crumb.href}
                                            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                        >
                                            {Icon && <Icon className="w-4 h-4" />}
                                            <span>{crumb.label}</span>
                                        </a>
                                    ) : (
                                        <span className={`flex items-center gap-1.5 text-sm ${isLast ? 'text-zinc-900 dark:text-zinc-100 font-medium' : 'text-zinc-500'}`}>
                                            {Icon && <Icon className="w-4 h-4" />}
                                            <span>{crumb.label}</span>
                                        </span>
                                    )}
                                </span>
                            )
                        })}
                    </div>

                    {/* Role Switcher (Dev Only) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 text-xs">
                                <Badge className={`${getRoleColor(role)} px-2 py-0.5`}>
                                    {getRoleLabel(role)}
                                </Badge>
                                <ChevronDown className="w-3 h-3 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {Object.values(ROLES).map((r) => (
                                <DropdownMenuItem
                                    key={r}
                                    onClick={() => setRole(r)}
                                    className={role === r ? 'bg-accent' : ''}
                                >
                                    <Badge className={`${getRoleColor(r)} mr-2`}>
                                        {getRoleLabel(r)}
                                    </Badge>
                                    {r === role && '✓'}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <div className="flex flex-1 flex-col gap-5 p-6">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
