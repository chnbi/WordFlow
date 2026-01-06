import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { parseExcelFile } from "@/lib/excel"

export default function ImportGlossaryDialog({ open, onOpenChange, onImport }) {
    const [file, setFile] = useState(null)
    const [sheets, setSheets] = useState([]) // { name, rowCount, entries[] }
    const [selectedSheet, setSelectedSheet] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState(1) // 1 = upload, 2 = select sheet
    const [isDragging, setIsDragging] = useState(false)

    const processFile = useCallback(async (selectedFile) => {
        if (!selectedFile) return

        setIsLoading(true)
        setFile(selectedFile)

        try {
            const parsed = await parseExcelFile(selectedFile)

            // Convert to sheet info for UI
            const sheetInfo = Object.entries(parsed).map(([name, data]) => ({
                name,
                rowCount: data.entries?.length || 0,
                entries: data.entries || []
            }))

            setSheets(sheetInfo)
            // Auto-select first sheet with data
            const firstValidSheet = sheetInfo.find(s => s.rowCount > 0)
            if (firstValidSheet) {
                setSelectedSheet(firstValidSheet.name)
            }
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

    const handleImport = () => {
        if (!selectedSheet) return

        const sheetData = sheets.find(s => s.name === selectedSheet)
        if (!sheetData) return

        // Map entries to glossary format
        const terms = (sheetData.entries || []).map(entry => ({
            term: entry.english || entry.term || '', // Flexible mapping
            english: entry.english || entry.term || '', // Keep 'english' for consistency
            malay: entry.malay || '',
            chinese: entry.chinese || '',
            category: entry.category || 'General',
            remark: entry.remark || ''
        })).filter(t => t.term) // Only include valid terms

        onImport(terms)
        handleClose()
    }

    const handleClose = () => {
        setFile(null)
        setSheets([])
        setSelectedSheet(null)
        setStep(1)
        setIsDragging(false)
        onOpenChange(false)
    }

    const selectedRowCount = sheets.find(s => s.name === selectedSheet)?.rowCount || 0

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Import Glossary Terms</DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Upload an Excel file to bulk add terms."
                            : "Select the sheet containing your terms."
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
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Select Sheet</Label>
                            </div>
                            <div className="border rounded-xl divide-y max-h-60 overflow-auto">
                                {sheets.map(sheet => {
                                    const isSelected = selectedSheet === sheet.name
                                    const hasRows = sheet.rowCount > 0
                                    return (
                                        <button
                                            key={sheet.name}
                                            onClick={() => setSelectedSheet(sheet.name)}
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
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    {step === 2 && (
                        <Button
                            onClick={handleImport}
                            disabled={!selectedSheet || selectedRowCount === 0}
                        >
                            Import {selectedRowCount} Terms
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
