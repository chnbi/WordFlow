// Image Translation - Upload images and extract text for translation
import { useState } from "react"
import { Upload, Image, FileText, Sparkles, X, CheckCircle2, Clock, ArrowRight, Languages, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

// Workflow states
const STATES = {
    UPLOAD: 'upload',      // Initial - waiting for file
    PREVIEW: 'preview',    // File uploaded, ready to extract
    EXTRACTING: 'extracting', // OCR in progress
    EDITING: 'editing',    // Extracted text, ready to edit/translate
}

export default function ImageTranslation() {
    const [state, setState] = useState(STATES.UPLOAD)
    const [uploadedFile, setUploadedFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [extractedLines, setExtractedLines] = useState([])
    const [progress, setProgress] = useState(0)

    // Handle file upload
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setUploadedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            setState(STATES.PREVIEW)
        }
    }

    // Handle drag and drop
    const handleDrop = (e) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setUploadedFile(file)
            setPreviewUrl(URL.createObjectURL(file))
            setState(STATES.PREVIEW)
        }
    }

    // Simulate extraction
    const handleExtract = () => {
        setState(STATES.EXTRACTING)
        setProgress(0)

        // Simulate progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    // Mock extracted lines
                    setExtractedLines([
                        { id: 1, text: "Welcome to our service", en: "Welcome to our service", my: "", zh: "" },
                        { id: 2, text: "Get started today", en: "Get started today", my: "", zh: "" },
                        { id: 3, text: "Premium features included", en: "Premium features included", my: "", zh: "" },
                    ])
                    setState(STATES.EDITING)
                    return 100
                }
                return prev + 10
            })
        }, 200)
    }

    // Reset to initial state
    const handleReset = () => {
        setUploadedFile(null)
        setPreviewUrl(null)
        setExtractedLines([])
        setState(STATES.UPLOAD)
    }

    // Delete a line
    const handleDeleteLine = (lineId) => {
        setExtractedLines(prev => prev.filter(line => line.id !== lineId))
    }

    // Simulate translate all
    const handleTranslateAll = async () => {
        for (let i = 0; i < extractedLines.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 400))
            setExtractedLines(prev => prev.map((line, idx) =>
                idx === i ? {
                    ...line,
                    my: `[MY] ${line.en}`,
                    zh: `[ZH] ${line.en}`,
                    translated: true
                } : line
            ))
        }
    }

    return (
        <div className="space-y-8 w-full max-w-5xl mx-auto pb-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Image Translation</h1>
                <p className="text-muted-foreground mt-1">
                    Upload images, extract text with OCR, and translate.
                </p>
            </div>

            {/* Upload Section */}
            {(state === STATES.UPLOAD || state === STATES.PREVIEW) && (
                <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 transition-colors hover:border-primary/50">
                    {state === STATES.UPLOAD ? (
                        /* Upload Zone */
                        <label
                            className="flex flex-col items-center justify-center cursor-pointer py-12"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <Upload className="w-8 h-8 text-primary" />
                            </div>
                            <p className="text-lg font-medium mb-1">Drop your image here</p>
                            <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                            <p className="text-xs text-muted-foreground">Supports: JPG, PNG, WEBP (Max 10MB)</p>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </label>
                    ) : (
                        /* Preview Zone */
                        <div className="space-y-6">
                            <div className="flex items-start gap-6">
                                {/* Image Preview */}
                                <div className="relative w-48 h-48 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={handleReset}
                                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* File Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Image className="w-5 h-5 text-primary" />
                                        <span className="font-medium">{uploadedFile?.name}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {(uploadedFile?.size / 1024).toFixed(1)} KB
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        <Button onClick={handleExtract} className="gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Extract Text
                                        </Button>
                                        <Button variant="outline" onClick={handleReset}>
                                            Upload Different
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Extracting State */}
            {state === STATES.EXTRACTING && (
                <div className="rounded-2xl border border-border bg-card p-8">
                    <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
                            <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-lg font-medium mb-4">Extracting text from image...</p>
                        <div className="w-64">
                            <Progress value={progress} className="h-2" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
                    </div>
                </div>
            )}

            {/* Editing State - Extracted Text */}
            {state === STATES.EDITING && (
                <>
                    {/* Image + Extracted Lines */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original Image */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="text-sm font-medium text-muted-foreground mb-3">Original Image</p>
                            <div className="rounded-xl overflow-hidden bg-muted">
                                <img
                                    src={previewUrl}
                                    alt="Original"
                                    className="w-full h-auto"
                                />
                            </div>
                        </div>

                        {/* Extracted Lines */}
                        <div className="rounded-2xl border border-border bg-card p-4">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-muted-foreground">Extracted Text</p>
                                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">
                                    {extractedLines.length} lines
                                </span>
                            </div>

                            <div className="space-y-3">
                                {extractedLines.map((line, index) => (
                                    <div key={line.id} className="p-3 rounded-xl bg-muted/50 border border-border/50">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <span className="text-xs text-muted-foreground">Line {index + 1}</span>
                                            <button
                                                onClick={() => handleDeleteLine(line.id)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-medium">{line.text}</p>
                                        {line.translated && (
                                            <div className="mt-2 space-y-1 text-xs">
                                                <p className="text-muted-foreground">MY: {line.my}</p>
                                                <p className="text-muted-foreground">ZH: {line.zh}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span>Text extracted successfully</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={handleReset}>
                                Start Over
                            </Button>
                            <Button className="gap-2" onClick={handleTranslateAll}>
                                <Languages className="w-4 h-4" />
                                Translate All
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
