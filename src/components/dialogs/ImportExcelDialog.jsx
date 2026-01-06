import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, Check, X, Loader2, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { parseExcelFile } from "@/lib/excel"
import { usePrompts } from "@/context/PromptContext"

export default function ImportExcelDialog({ open, onOpenChange, onImport }) {
    const { templates } = usePrompts()
    const [file, setFile] = useState(null)
    const [sheets, setSheets] = useState([]) // { name, rowCount, entries[] }
    const [selectedSheets, setSelectedSheets] = useState([])
    const [projectName, setProjectName] = useState("")
    const [selectedPromptId, setSelectedPromptId] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState(1) // 1 = upload, 2 = select sheets
    const [isDragging, setIsDragging] = useState(false)
    const [parsedData, setParsedData] = useState({}) // Full parsed data from parseExcelFile

    const processFile = useCallback(async (selectedFile) => {
        if (!selectedFile) return

        setIsLoading(true)
        setFile(selectedFile)
        setProjectName(selectedFile.name.replace(/\.(xlsx|xls)$/, ""))

        try {
            // Use the robust parseExcelFile function that handles column detection
            const parsed = await parseExcelFile(selectedFile)
            setParsedData(parsed)

            // Convert to sheet info for UI
            const sheetInfo = Object.entries(parsed).map(([name, data]) => ({
                name,
                rowCount: data.entries?.length || 0,
                entries: data.entries || []
            }))

            setSheets(sheetInfo)
            setSelectedSheets(sheetInfo.filter(s => s.rowCount > 0).map(s => s.name))
            setStep(2)
        } catch (error) {
            console.error("Error reading Excel file:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const handleFileChange = (e) => {
        processFile(e.target.files?.[0])
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)

        const droppedFile = e.dataTransfer.files?.[0]
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
            processFile(droppedFile)
        }
    }

    const toggleSheet = (sheetName) => {
        setSelectedSheets(prev =>
            prev.includes(sheetName)
                ? prev.filter(s => s !== sheetName)
                : [...prev, sheetName]
        )
    }

    const handleImport = () => {
        if (selectedSheets.length === 0) return

        // Build pages with actual row data
        const pagesWithData = selectedSheets.map(sheetName => {
            const sheetData = sheets.find(s => s.name === sheetName)
            return {
                name: sheetName,
                rowCount: sheetData?.rowCount || 0,
                // Map entries to our internal format: { en, my, zh, status }
                rows: (sheetData?.entries || []).map((entry, idx) => ({
                    id: `row_${Date.now()}_${idx}`,
                    key: `row_${idx}`,
                    en: entry.english || '',
                    my: entry.malay || '',
                    zh: entry.chinese || '',
                    status: 'pending',
                    source: entry.english || ''
                })).filter(row => row.en) // Only include rows with source text
            }
        })

        onImport({
            projectName,
            fileName: file.name,
            pages: pagesWithData,
            defaultPromptId: selectedPromptId
        })
        handleClose()
    }

    const handleClose = () => {
        setFile(null)
        setSheets([])
        setSelectedSheets([])
        setProjectName("")
        setSelectedPromptId(null)
        setStep(1)
        setIsDragging(false)
        setParsedData({})
        onOpenChange(false)
    }

    // Count total rows across selected sheets
    const totalSelectedRows = selectedSheets.reduce((sum, name) => {
        const sheet = sheets.find(s => s.name === name)
        return sum + (sheet?.rowCount || 0)
    }, 0)

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import Excel File</DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Upload an Excel file to create a new project."
                            : "Select which sheets to import as pages."
                        }
                    </DialogDescription>
                </DialogHeader>

                {step === 1 && (
                    <div className="py-6">
                        <label
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${isDragging
                                ? "border-primary bg-primary/10 scale-[1.02]"
                                : "border-muted hover:border-primary/50 hover:bg-primary/5"
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            ) : (
                                <>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragging ? "bg-primary/20" : "bg-primary/10"
                                        }`}>
                                        <Upload className={`w-7 h-7 text-primary transition-transform ${isDragging ? "scale-110" : ""}`} />
                                    </div>
                                    <p className="font-medium text-foreground">
                                        {isDragging ? "Drop to upload" : "Drop your file here"}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
                                    <p className="text-xs text-muted-foreground mt-3">Supports .xlsx and .xls</p>
                                </>
                            )}
                            <input
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {step === 2 && (
                    <div className="py-4 space-y-5">
                        {/* Project Name */}
                        <div className="space-y-2">
                            <Label>Project Name</Label>
                            <Input
                                value={projectName}
                                onChange={e => setProjectName(e.target.value)}
                                placeholder="My Translation Project"
                            />
                        </div>

                        {/* Default Prompt */}
                        <div className="space-y-2">
                            <Label>Default Translation Prompt</Label>
                            <Select value={selectedPromptId || ""} onValueChange={setSelectedPromptId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a prompt template..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                This prompt will be used for all rows by default. You can override per row later.
                            </p>
                        </div>

                        {/* Sheet Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Sheets to Import</Label>
                                <span className="text-xs text-muted-foreground">
                                    {selectedSheets.length} of {sheets.length} • {totalSelectedRows} rows
                                </span>
                            </div>
                            <div className="border rounded-xl divide-y max-h-60 overflow-auto">
                                {sheets.map(sheet => {
                                    const isSelected = selectedSheets.includes(sheet.name)
                                    const hasRows = sheet.rowCount > 0
                                    return (
                                        <button
                                            key={sheet.name}
                                            onClick={() => toggleSheet(sheet.name)}
                                            disabled={!hasRows}
                                            className={`w-full flex items-center justify-between p-3 text-left transition-colors ${!hasRows ? "opacity-50 cursor-not-allowed" :
                                                isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/30"
                                                    }`}>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                                                    <span className="font-medium text-sm">{sheet.name}</span>
                                                </div>
                                            </div>
                                            <span className={`text-xs ${hasRows ? 'text-muted-foreground' : 'text-destructive'}`}>
                                                {hasRows ? `${sheet.rowCount} rows` : 'No data found'}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                            {sheets.every(s => s.rowCount === 0) && (
                                <p className="text-sm text-destructive">
                                    No translation data found. Make sure your Excel has columns like "English", "Malay", "Chinese".
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    {step === 2 && (
                        <Button
                            onClick={handleImport}
                            disabled={selectedSheets.length === 0 || !projectName.trim() || totalSelectedRows === 0}
                        >
                            Import {totalSelectedRows} Rows
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

