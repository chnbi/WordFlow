import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, Check, X, Loader2 } from "lucide-react"
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
import * as XLSX from "xlsx"

export default function ImportExcelDialog({ open, onOpenChange, onImport }) {
    const [file, setFile] = useState(null)
    const [sheets, setSheets] = useState([])
    const [selectedSheets, setSelectedSheets] = useState([])
    const [projectName, setProjectName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState(1) // 1 = upload, 2 = select sheets

    const handleFileChange = useCallback(async (e) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setIsLoading(true)
        setFile(selectedFile)
        setProjectName(selectedFile.name.replace(/\.(xlsx|xls)$/, ""))

        try {
            const data = await selectedFile.arrayBuffer()
            const workbook = XLSX.read(data, { type: "array" })

            const sheetInfo = workbook.SheetNames.map(name => {
                const sheet = workbook.Sheets[name]
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
                return {
                    name,
                    rowCount: rows.length,
                    selected: true
                }
            })

            setSheets(sheetInfo)
            setSelectedSheets(sheetInfo.map(s => s.name))
            setStep(2)
        } catch (error) {
            console.error("Error reading Excel file:", error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    const toggleSheet = (sheetName) => {
        setSelectedSheets(prev =>
            prev.includes(sheetName)
                ? prev.filter(s => s !== sheetName)
                : [...prev, sheetName]
        )
    }

    const handleImport = () => {
        if (selectedSheets.length === 0) return

        onImport({
            projectName,
            fileName: file.name,
            pages: selectedSheets.map(name => ({
                name,
                rowCount: sheets.find(s => s.name === name)?.rowCount || 0
            }))
        })
        handleClose()
    }

    const handleClose = () => {
        setFile(null)
        setSheets([])
        setSelectedSheets([])
        setProjectName("")
        setStep(1)
        onOpenChange(false)
    }

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
                            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                        >
                            {isLoading ? (
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            ) : (
                                <>
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                        <Upload className="w-7 h-7 text-primary" />
                                    </div>
                                    <p className="font-medium text-foreground">Drop your file here</p>
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

                        {/* Sheet Selection */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Sheets to Import</Label>
                                <span className="text-xs text-muted-foreground">
                                    {selectedSheets.length} of {sheets.length} selected
                                </span>
                            </div>
                            <div className="border rounded-xl divide-y max-h-60 overflow-auto">
                                {sheets.map(sheet => {
                                    const isSelected = selectedSheets.includes(sheet.name)
                                    return (
                                        <button
                                            key={sheet.name}
                                            onClick={() => toggleSheet(sheet.name)}
                                            className={`w-full flex items-center justify-between p-3 text-left transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-muted/50"
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
                                            <span className="text-xs text-muted-foreground">
                                                {sheet.rowCount} rows
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
                            disabled={selectedSheets.length === 0 || !projectName.trim()}
                        >
                            Import {selectedSheets.length} Page{selectedSheets.length !== 1 ? "s" : ""}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
