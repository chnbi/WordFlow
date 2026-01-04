// Home - Dashboard with statistics and recent projects
import { Folder, FileText, CheckCircle2, Clock, Plus, Upload, Image, ArrowRight, MoreHorizontal } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/App"
import { useProjects } from "@/context/ProjectContext"
import { glossaryTerms } from "@/data/mockData"

const quickActions = [
    { id: "new", icon: Plus, label: "New Project", href: "#projects", color: "bg-primary text-primary-foreground" },
    { id: "import", icon: Upload, label: "Import Excel", href: "#projects", color: "bg-amber-50 text-amber-600" },
    { id: "image", icon: Image, label: "Image Translation", href: "#image-translate", color: "bg-blue-50 text-blue-600" },
]

export default function Home() {
    const { user } = useAuth()
    const { projects, stats } = useProjects()

    // Build stats dynamically
    const statsData = [
        { label: "Total Projects", value: stats.totalProjects, icon: Folder, color: "bg-blue-50 text-blue-600" },
        { label: "In Progress", value: stats.inProgress, icon: Clock, color: "bg-amber-50 text-amber-600" },
        { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
        { label: "Glossary Terms", value: glossaryTerms.length, icon: FileText, color: "bg-violet-50 text-violet-600" },
    ]

    return (
        <div className="space-y-8 w-full max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    Welcome back, {user?.displayName || "User"}
                </h1>
                <p className="text-muted-foreground mt-1">
                    Here's an overview of your translation projects.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.label}
                            className="p-5 rounded-2xl bg-card border border-border/50 shadow-card"
                        >
                            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                    {quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                            <a
                                key={action.id}
                                href={action.href}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02] ${action.color}`}
                            >
                                <Icon className="w-4 h-4" />
                                {action.label}
                            </a>
                        )
                    })}
                </div>
            </div>

            {/* Recent Projects - Card Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold">Projects</h2>
                        <p className="text-sm text-muted-foreground">You have {projects.length} projects</p>
                    </div>
                    <a href="#projects" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                        View All <ArrowRight className="w-3 h-3" />
                    </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {projects.slice(0, 4).map((project) => {
                        // Safe defaults for Firestore projects that may not have all fields
                        const color = project.color || 'bg-gradient-to-br from-blue-500 to-blue-600'
                        const progress = project.progress || 0
                        const team = project.team || []
                        const lastUpdated = project.lastUpdated || 'Recently'

                        return (
                            <a
                                key={project.id}
                                href={`#project/${project.id}`}
                                className={`${color} rounded-2xl p-5 text-white transition-all hover:scale-[1.02] hover:shadow-lg relative overflow-hidden group`}
                            >
                                {/* Menu Button */}
                                <button className="absolute top-4 right-4 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {/* Project Name */}
                                <h3 className="font-semibold text-lg leading-tight mb-6 pr-6">
                                    {project.name}
                                </h3>

                                {/* Progress */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                        <span className="text-white/80">Progress</span>
                                        <span className="font-medium">{progress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white rounded-full transition-all"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Footer: Avatars + Date */}
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {team.slice(0, 3).map((member, i) => (
                                            <Avatar key={i} className="h-7 w-7 border-2 border-current">
                                                <AvatarFallback className="text-[10px] bg-white/20 text-white">
                                                    {member.initials || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                    <span className="text-sm text-white/80">{lastUpdated}</span>
                                </div>
                            </a>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

