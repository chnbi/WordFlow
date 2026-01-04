import { useState } from "react"
import { Search, Plus, SlidersHorizontal, FileText, Megaphone, Code, Scale, MessageSquare, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PromptCard from "@/components/prompt-card"
import PromptDetailDialog from "@/components/prompt-detail-dialog"
import { usePrompts } from "@/context/PromptContext"
import { useAuth, ACTIONS } from "@/App"

// Expanded Mock Data
const initialTemplates = [
    {
        id: 1,
        name: "Formal Business",
        icon: FileText,
        color: "bg-blue-50 dark:bg-blue-950/30",
        iconBg: "bg-blue-100 dark:bg-blue-900/50",
        iconColor: "text-blue-600 dark:text-blue-400",
        description: "Professional tone for corporate communications, reports, and official documents. Ensures politeness and proper terminology.",
        prompt: "Translate the following text into {target_language}. Maintain a formal, professional tone suitable for corporate communications. Preserve any technical terminology and proper nouns. Use polite forms where applicable.",
        tags: ["Business", "Formal", "Corporate"],
        variables: ["target_language"],
        author: "System"
    },
    {
        id: 2,
        name: "Marketing Copy",
        icon: Megaphone,
        color: "bg-pink-50 dark:bg-pink-950/30",
        iconBg: "bg-pink-100 dark:bg-pink-900/50",
        iconColor: "text-pink-600 dark:text-pink-400",
        description: "Persuasive content for ads, promotions, and brand messaging. Focuses on emotional impact.",
        prompt: "Translate the following marketing content into {target_language}. Prioritize emotional impact and natural flow over literal accuracy. Adapt idioms and cultural references for the target audience.",
        tags: ["Marketing", "Creative", "Persuasive"],
        variables: ["target_language"],
        author: "Marketing Team"
    },
    {
        id: 3,
        name: "Technical Docs",
        icon: Code,
        color: "bg-violet-50 dark:bg-violet-950/30",
        iconBg: "bg-violet-100 dark:bg-violet-900/50",
        iconColor: "text-violet-600 dark:text-violet-400",
        description: "Precise language for software documentation and technical guides. Preserves code blocks.",
        prompt: "Translate the following technical documentation into {target_language}. Keep all code snippets, variable names, and technical terms unchanged. Maintain precise, clear language.",
        tags: ["Technical", "Documentation", "Software"],
        variables: ["target_language"],
        author: "Dev Team"
    },
    {
        id: 4,
        name: "Legal Contracts",
        icon: Scale,
        color: "bg-amber-50 dark:bg-amber-950/30",
        iconBg: "bg-amber-100 dark:bg-amber-900/50",
        iconColor: "text-amber-600 dark:text-amber-400",
        description: "Accurate translations for contracts, policies, and legal documents. Zero hallucination tolerance.",
        prompt: "Translate the following legal text into {target_language}. Maintain the precise legal meaning and terminology. Do not paraphrase or simplify legal terms.",
        tags: ["Legal", "Compliance", "Strict"],
        variables: ["target_language"],
        author: "Legal Dept"
    },
    {
        id: 5,
        name: "Social Media / Chat",
        icon: MessageSquare,
        color: "bg-emerald-50 dark:bg-emerald-950/30",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        description: "Friendly tone for social media posts, community management, and casual chats.",
        prompt: "Translate the following text into {target_language} in a casual, conversational tone. Feel free to use colloquial expressions and local slang where appropriate.",
        tags: ["Social", "Casual", "Chat"],
        variables: ["target_language"],
        author: "Social Team"
    },
]

export default function PromptLibrary() {
    const { templates, addTemplate, updateTemplate, deleteTemplate, duplicateTemplate } = usePrompts()
    const { canDo } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("all")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [toastMessage, setToastMessage] = useState(null)
    const [deleteConfirm, setDeleteConfirm] = useState(null)

    // Filter Logic
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))

        if (activeTab === "all") return matchesSearch
        if (activeTab === "system") return matchesSearch && template.author === "System"
        if (activeTab === "custom") return matchesSearch && template.author !== "System"
        return matchesSearch
    })

    const handleCreate = () => {
        setEditingTemplate(null)
        setIsDialogOpen(true)
    }

    const handleEdit = (template) => {
        setEditingTemplate(template)
        setIsDialogOpen(true)
    }

    const handleSave = (data) => {
        if (editingTemplate) {
            updateTemplate(editingTemplate.id, data)
        } else {
            addTemplate(data)
        }
    }

    const handleDelete = (id) => {
        deleteTemplate(id)
        setDeleteConfirm(null)
    }

    const handleDuplicate = (template) => {
        duplicateTemplate(template.id)
    }

    const handleUse = (template) => {
        // Copy prompt to clipboard and show toast
        navigator.clipboard.writeText(template.prompt)
        setToastMessage(`Prompt "${template.name}" copied to clipboard!`)
        setTimeout(() => setToastMessage(null), 3000)
    }

    return (
        <div className="space-y-8 w-full max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Prompt Library</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and engineer your translation prompts.
                    </p>
                </div>
                <Button size="lg" onClick={handleCreate} className="rounded-xl shadow-sm px-6">
                    <Plus className="w-5 h-5 mr-2" />
                    New Prompt
                </Button>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-6">
                <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
                    <TabsList className="bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="all" className="rounded-lg px-4">All Templates</TabsTrigger>
                        <TabsTrigger value="system" className="rounded-lg px-4">System</TabsTrigger>
                        <TabsTrigger value="custom" className="rounded-lg px-4">My Prompts</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, tag, or context..."
                            className="pl-9 h-10 bg-background rounded-xl border-zinc-200 dark:border-zinc-800"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                    <PromptCard
                        key={template.id}
                        template={template}
                        onEdit={handleEdit}
                        onDuplicate={handleDuplicate}
                        onUse={() => handleUse(template)}
                        onDelete={() => setDeleteConfirm(template.id)}
                        isSystemPrompt={template.author === "System"}
                    />
                ))}

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl border-muted">
                        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">No prompts found</h3>
                        <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                            We couldn't find any prompts matching "{searchQuery}". Try a different specific search term or clear filters.
                        </p>
                        <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
                    </div>
                )}
            </div>

            <PromptDetailDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={editingTemplate}
                onSave={handleSave}
            />

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-zinc-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    {toastMessage}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">Delete Template?</h3>
                        <p className="text-muted-foreground text-sm mb-4">
                            This action cannot be undone. The prompt template will be permanently deleted.
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
