import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LANGUAGES } from "@/lib/constants"
import { useProjects } from "@/context/ProjectContext"
import { toast } from "sonner"
import { Globe, Type } from "lucide-react"

// Derive available targets from registry (exclude en)
const AVAILABLE_TARGETS = Object.values(LANGUAGES).filter(l => l.code !== 'en')

export function ProjectSettingsDialog({ open, onOpenChange, project }) {
    const { updateProject } = useProjects()
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    const [projectName, setProjectName] = useState("")
    const [selectedLanguages, setSelectedLanguages] = useState([])

    // Sync from project when it loads or changes
    useEffect(() => {
        if (project) {
            setProjectName(project.name || "")
            setSelectedLanguages(project.targetLanguages || ['my', 'zh'])
        }
    }, [project])

    const handleToggleLanguage = (langCode) => {
        setSelectedLanguages(prev => {
            if (prev.includes(langCode)) {
                return prev.filter(l => l !== langCode)
            } else {
                return [...prev, langCode]
            }
        })
    }

    const handleSave = async () => {
        if (!projectName.trim()) {
            toast.error("Project name cannot be empty")
            return
        }
        if (selectedLanguages.length === 0) {
            toast.error("Please select at least one target language")
            return
        }

        setIsLoading(true)
        try {
            await updateProject(project.id, {
                name: projectName.trim(),
                targetLanguages: selectedLanguages
            })
            toast.success("Project settings updated")
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to update settings")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-slate-500" />
                        Project Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="py-2 space-y-6">
                    {/* Project Name */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                            <Type className="w-4 h-4 text-slate-500" />
                            Project Name
                        </h3>
                        <Input 
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="e.g., Q1 Marketing Campaign"
                        />
                    </div>

                    {/* Target Languages */}
                    <div>
                        <h3 className="text-sm font-medium mb-3 text-slate-900 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-slate-500" />
                            Target Languages
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Select languages to translate into. Unchecking a language will hide its column but preserve the data.
                        </p>

                        <div className="space-y-3">
                            {AVAILABLE_TARGETS.map((lang) => (
                                <div key={lang.code} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`lang-${lang.code}`}
                                        checked={selectedLanguages.includes(lang.code)}
                                        onCheckedChange={() => handleToggleLanguage(lang.code)}
                                    />
                                    <Label
                                        htmlFor={`lang-${lang.code}`}
                                        className="text-sm font-normal cursor-pointer select-none"
                                    >
                                        {lang.label} <span className="text-slate-400">({lang.nativeLabel})</span>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
