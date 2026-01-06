import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"

// Use-case categories for translation prompts
const DEFAULT_CATEGORIES = {
    'banner': { label: 'Banner Slogan', color: 'bg-pink-50 text-pink-600' },
    'button': { label: 'Button Text', color: 'bg-blue-50 text-blue-600' },
    'features': { label: 'Features', color: 'bg-violet-50 text-violet-600' },
    'narratives': { label: 'Narratives', color: 'bg-emerald-50 text-emerald-600' },
    'news': { label: 'News', color: 'bg-amber-50 text-amber-600' },
    'legal': { label: 'Legal', color: 'bg-slate-100 text-slate-600' },
    'social': { label: 'Social Media', color: 'bg-cyan-50 text-cyan-600' },
    'technical': { label: 'Technical', color: 'bg-orange-50 text-orange-600' },
}

// Status options
const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'review', label: 'In Review' },
    { value: 'published', label: 'Published' },
]

export default function PromptDetailDialog({ open, onOpenChange, initialData, onSave, categories = DEFAULT_CATEGORIES }) {
    const [formData, setFormData] = useState({
        name: '',
        prompt: '',
        category: 'narratives',
        status: 'draft'
    })

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    name: initialData.name || '',
                    prompt: initialData.prompt || '',
                    category: initialData.category || 'narratives',
                    status: initialData.status || 'draft'
                })
            } else {
                setFormData({
                    name: '',
                    prompt: '',
                    category: 'narratives',
                    status: 'draft'
                })
            }
        }
    }, [open, initialData])

    const handleSave = () => {
        if (!formData.name.trim() || !formData.prompt.trim()) return
        onSave(formData)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
                    <DialogDescription>
                        Create a prompt template for a specific translation use case.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label>Prompt Name <span className="text-destructive">*</span></Label>
                        <Input
                            placeholder="e.g. Banner Headlines"
                            value={formData.name}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                    </div>

                    {/* Category & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {Object.entries(categories).map(([key, { label }]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full h-10 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Prompt Text */}
                    <div className="space-y-2">
                        <Label>Prompt Template <span className="text-destructive">*</span></Label>
                        <Textarea
                            className="h-[180px] font-mono text-sm leading-relaxed"
                            placeholder="Translate the following text into {target_language}. Maintain a professional tone suitable for banner headlines..."
                            value={formData.prompt}
                            onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Write instructions for the AI. Be specific about tone, style, and any restrictions.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={!formData.name.trim() || !formData.prompt.trim()}
                    >
                        {initialData ? 'Save Changes' : 'Create Prompt'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
