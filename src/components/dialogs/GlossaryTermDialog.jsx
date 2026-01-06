import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"

const categories = ["UI", "General", "Account", "Actions", "Legal", "Marketing", "Technical"]
const statuses = [
    { value: "draft", label: "Draft", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
    { value: "approved", label: "Approved", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
    { value: "deprecated", label: "Deprecated", color: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400" },
]

export default function GlossaryTermDialog({ open, onOpenChange, initialData, onSave }) {
    const [formData, setFormData] = useState({
        english: '',
        malay: '',
        chinese: '',
        category: 'General',
        status: 'draft',
        remark: '',
    })

    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData(initialData)
            } else {
                setFormData({
                    english: '',
                    malay: '',
                    chinese: '',
                    category: 'General',
                    status: 'draft',
                    remark: '',
                })
            }
        }
    }, [open, initialData])

    const handleSave = () => {
        onSave(formData)
        onOpenChange(false)
    }

    const selectedStatus = statuses.find(s => s.value === formData.status)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Term' : 'Add New Term'}</DialogTitle>
                    <DialogDescription>
                        Define translations for all three languages.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 py-4">
                    {/* Language Fields */}
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>English</Label>
                            <Input
                                placeholder="e.g. Dashboard"
                                value={formData.english}
                                onChange={e => setFormData(prev => ({ ...prev, english: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Bahasa Malaysia</Label>
                                <Input
                                    placeholder="e.g. Papan Pemuka"
                                    value={formData.malay}
                                    onChange={e => setFormData(prev => ({ ...prev, malay: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>中文</Label>
                                <Input
                                    placeholder="e.g. 仪表板"
                                    value={formData.chinese}
                                    onChange={e => setFormData(prev => ({ ...prev, chinese: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select value={formData.category} onValueChange={v => setFormData(prev => ({ ...prev, category: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={v => setFormData(prev => ({ ...prev, status: v }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statuses.map(s => (
                                        <SelectItem key={s.value} value={s.value}>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${s.value === 'draft' ? 'bg-amber-500' : s.value === 'approved' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                                {s.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Remark */}
                    <div className="space-y-2">
                        <Label>Remark</Label>
                        <Textarea
                            placeholder="Any notes about usage, context, or alternatives to avoid..."
                            className="h-20 resize-none"
                            value={formData.remark}
                            onChange={e => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Term</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
