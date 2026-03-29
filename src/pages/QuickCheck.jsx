// Quick Check - Translation tool with glossary highlighting
// Uses consistent styling with DataTable component
import { useState, useMemo, useRef, useEffect } from "react"
import { useGlossary } from "@/context/GlossaryContext"
import { usePrompts } from "@/context/PromptContext"
import { getAI } from "@/api/ai"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TABLE_STYLES } from "@/components/ui/DataTable"
import { Loader2, Sparkles, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { GlossaryHighlighter } from "@/components/ui/GlossaryHighlighter"
import { COLORS, PageContainer, Card } from "@/components/ui/shared"
import { handleTranslationError } from "@/lib/utils"
import { PageHeader } from "@/components/ui/common"

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'my', name: 'Bahasa Malaysia' },
    { code: 'zh', name: 'Chinese' },
]

export default function QuickCheck() {
    const { approvedTerms: glossaryTerms } = useGlossary() // Use APPROVED terms for highlighting
    const { templates } = usePrompts()

    const [sourceLanguage, setSourceLanguage] = useState('en')
    const [targetLanguage, setTargetLanguage] = useState('zh')
    const [sourceText, setSourceText] = useState('')
    const [translatedText, setTranslatedText] = useState('')
    const [isTranslating, setIsTranslating] = useState(false)
    const [hasTranslated, setHasTranslated] = useState(false)
    const [isEditing, setIsEditing] = useState(true)
    const [hoveredTermId, setHoveredTermId] = useState(null)
    const [copiedSource, setCopiedSource] = useState(false)
    const [copiedTarget, setCopiedTarget] = useState(false)

    // Get default template
    const defaultTemplate = useMemo(() => {
        const publishedTemplates = templates?.filter(t => t.status !== 'draft') || []
        return publishedTemplates.find(t => t.isDefault) ||
            publishedTemplates[0] ||
        {
            name: 'Default',
            prompt: 'Translate accurately while maintaining the original meaning and tone.'
        }
    }, [templates])

    const canTranslate = sourceText.trim().length > 0 && !isTranslating

    const handleTranslate = async () => {
        if (!canTranslate) return

        setIsTranslating(true)
        setTranslatedText('')
        setHasTranslated(false)

        try {
            const results = await getAI().generateBatch(
                [{ id: 1, text: sourceText }],
                {
                    sourceLanguage: sourceLanguage,
                    targetLanguages: [targetLanguage],
                    glossaryTerms: glossaryTerms || [],
                    template: defaultTemplate
                }
            )


            const result = results[0]
            // Fix: Provider returns { translations: { [lang]: { text: "..." } } }
            let translatedContent = result?.translations?.[targetLanguage]?.text || result?.[targetLanguage] || ''

            // B-035 fix: Strip leading/trailing whitespace and normalize — if the AI
            // returned ALL-UPPERCASE text but the source was NOT all-uppercase, revert
            // to sentence-case.  This is a safety net; the prompt-level fix should
            // prevent the issue in most cases.
            if (
                translatedContent &&
                translatedContent === translatedContent.toUpperCase() &&
                sourceText !== sourceText.toUpperCase() &&
                translatedContent.length > 3 // skip acronyms
            ) {
                // Convert ALL-CAPS to sentence case (first letter uppercase, rest lowercase)
                translatedContent = translatedContent.charAt(0) + translatedContent.slice(1).toLowerCase()
            }

            setTranslatedText(translatedContent)
            setHasTranslated(true)
            setIsEditing(false)

            if (result?.status === 'error') {
                toast.error('Translation failed')
            }
        } catch (error) {
            handleTranslationError(error)
        } finally {
            setIsTranslating(false)
        }
    }

    const handleSourceChange = (e) => {
        setSourceText(e.target.value)
        setHasTranslated(false)
    }

    // Copy to clipboard helpers
    const handleCopySource = async () => {
        if (!sourceText) return
        try {
            await navigator.clipboard.writeText(sourceText)
            setCopiedSource(true)
            setTimeout(() => setCopiedSource(false), 2000)
        } catch {
            toast.error("Failed to copy")
        }
    }

    const handleCopyTarget = async () => {
        if (!translatedText) return
        try {
            await navigator.clipboard.writeText(translatedText)
            setCopiedTarget(true)
            setTimeout(() => setCopiedTarget(false), 2000)
        } catch {
            toast.error("Failed to copy")
        }
    }

    // Auto-swap: if the user picks a source/target that matches the other,
    // swap them so neither dropdown gets "stuck".
    const handleSourceLanguageChange = (val) => {
        if (val === targetLanguage) {
            setTargetLanguage(sourceLanguage)
        }
        setSourceLanguage(val)
        setHasTranslated(false)
    }

    const handleTargetLanguageChange = (val) => {
        if (val === sourceLanguage) {
            setSourceLanguage(targetLanguage)
        }
        setTargetLanguage(val)
        setHasTranslated(false)
    }

    return (
        <PageContainer>
            {/* Header */}
            <PageHeader description="Translate text instantly and check against your glossary">Quick Check</PageHeader>

            {/* Two Column Layout - Using DataTable container styling */}
            <div className={`${TABLE_STYLES.container} overflow-hidden border border-gray-200 dark:border-slate-800`}>
                <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-slate-800">
                    {/* Source Panel */}
                    <div className="bg-white dark:bg-slate-900 flex flex-col">
                        {/* Header Row */}
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-sm text-muted-foreground">
                            <span className="whitespace-nowrap">Translate from</span>
                            <Select value={sourceLanguage} onValueChange={handleSourceLanguageChange}>
                                <SelectTrigger className="w-40 h-8 bg-transparent border-0 shadow-none text-slate-900 dark:text-slate-100 focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Copy source button */}
                            <button
                                onClick={handleCopySource}
                                disabled={!sourceText}
                                className="ml-auto p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Copy source text"
                            >
                                {copiedSource ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Text area container — grows to match sibling */}
                        <div className="relative min-h-[280px] flex-1">
                            {hasTranslated && !isEditing ? (
                                <div
                                    onClick={() => setIsEditing(true)}
                                    className={`w-full h-full p-6 overflow-auto ${TABLE_STYLES.textClass} leading-relaxed whitespace-pre-wrap font-sans cursor-text hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-slate-700 dark:text-slate-300`}
                                    title="Click to edit"
                                >
                                    <GlossaryHighlighter
                                        text={sourceText}
                                        language={sourceLanguage}
                                        glossaryTerms={glossaryTerms}
                                        hoveredTermId={hoveredTermId}
                                        onHover={setHoveredTermId}
                                    />
                                </div>
                            ) : (
                                /* Editable textarea (Edit Mode) */
                                <textarea
                                    value={sourceText}
                                    onChange={(e) => {
                                        handleSourceChange(e)
                                        setIsEditing(true)
                                    }}
                                    autoFocus={isEditing && hasTranslated}
                                    placeholder="Enter text to translate..."
                                    className={`w-full h-full min-h-[280px] p-6 bg-transparent resize-none border-none focus:ring-0 focus:outline-none ${TABLE_STYLES.textClass} leading-relaxed font-sans text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 caret-slate-900 dark:caret-slate-100`}
                                />
                            )}
                        </div>
                    </div>

                    {/* Target Panel */}
                    <div className="bg-white dark:bg-slate-900 flex flex-col">
                        {/* Header Row */}
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-sm text-muted-foreground">
                            <span className="whitespace-nowrap">Translate to</span>
                            <Select value={targetLanguage} onValueChange={handleTargetLanguageChange}>
                                <SelectTrigger className="w-40 h-8 bg-transparent border-0 shadow-none text-slate-900 dark:text-slate-100 focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Copy target button */}
                            <button
                                onClick={handleCopyTarget}
                                disabled={!translatedText}
                                className="ml-auto p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Copy translated text"
                            >
                                {copiedTarget ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Result area — grows to match sibling */}
                        <div className={`min-h-[280px] flex-1 p-6 ${TABLE_STYLES.textClass} leading-relaxed text-slate-700 dark:text-slate-300`}>
                            {isTranslating ? (
                                <div className="flex items-center text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Translating...
                                </div>
                            ) : translatedText ? (
                                <div className="whitespace-pre-wrap">
                                    <GlossaryHighlighter
                                        text={translatedText}
                                        language={targetLanguage}
                                        glossaryTerms={glossaryTerms}
                                        hoveredTermId={hoveredTermId}
                                        onHover={setHoveredTermId}
                                    />
                                </div>
                            ) : (
                                <span className="text-muted-foreground">
                                    Translation will appear here...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Centered Translate Button */}
            <div className="flex justify-center mt-8">
                <Button
                    onClick={handleTranslate}
                    disabled={!canTranslate}
                    className={`px-8 h-10 rounded-full font-medium transition-all shadow-sm hover:shadow-md ${canTranslate ? 'bg-primary hover:bg-primary-hover text-white' : 'bg-slate-200 text-slate-400'}`}
                >
                    {isTranslating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Translating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Translate
                        </>
                    )}
                </Button>
            </div>
        </PageContainer>
    )
}
