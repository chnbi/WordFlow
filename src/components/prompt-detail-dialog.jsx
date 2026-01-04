import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Sparkles } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState, useEffect } from "react"

export default function PromptDetailDialog({ open, onOpenChange, initialData, onSave }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        prompt: '',
        tags: [],
        variables: []
    })
    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData(initialData)
            } else {
                setFormData({
                    name: '',
                    description: '',
                    prompt: '',
                    tags: [],
                    variables: []
                })
            }
        }
    }, [open, initialData])

    // Auto-extract variables from prompt text
    useEffect(() => {
        const regex = /\{([^}]+)\}/g
        const matches = [...formData.prompt.matchAll(regex)].map(m => m[1])
        const uniqueVars = [...new Set(matches)]

        if (JSON.stringify(uniqueVars) !== JSON.stringify(formData.variables)) {
            setFormData(prev => ({ ...prev, variables: uniqueVars }))
        }
    }, [formData.prompt])

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    tags: [...prev.tags, tagInput.trim()]
                }))
            }
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const handleSave = () => {
        onSave(formData)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Prompt Template' : 'Create New Prompt'}</DialogTitle>
                    <DialogDescription>
                        Design your translation prompt. Use <code className="text-xs bg-muted px-1 py-0.5 rounded">{"{variable}"}</code> syntax for dynamic placeholders.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                placeholder="e.g. Marketing Copy"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="relative">
                                <Input
                                    placeholder="Press Enter to add tags..."
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                            </div>
                        </div>
                    </div>

                    {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 -mt-2">
                            {formData.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            placeholder="Briefly describe when to use this prompt..."
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Prompt Template</Label>
                            <div className="text-xs text-muted-foreground">
                                {formData.variables.length} variables detected
                            </div>
                        </div>
                        <Textarea
                            className="h-[200px] font-mono text-sm leading-relaxed"
                            placeholder="Translate the following text into {target_language}..."
                            value={formData.prompt}
                            onChange={e => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                        />
                    </div>

                    {/* Variable Preview */}
                    {formData.variables.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p className="font-semibold mb-2 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                Detected Variables
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {formData.variables.map(v => (
                                    <code key={v} className="bg-background border px-1.5 py-0.5 rounded text-xs text-primary">
                                        {v}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
