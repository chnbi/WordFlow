// Quick Check - Translation tool with glossary highlighting
// Uses consistent styling with DataTable component
import { useState, useMemo } from "react"
import { useGlossary } from "@/context/GlossaryContext"
import { usePrompts } from "@/context/PromptContext"
import { translateBatch } from "@/api/gemini/text"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TABLE_STYLES } from "@/components/ui/DataTable"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'my', name: 'Bahasa Malaysia' },
    { code: 'zh', name: 'Chinese' },
]

// Escape special regex characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Find glossary matches in text
function findGlossaryMatches(text, glossaryTerms, languageCode) {
    if (!text || !glossaryTerms || glossaryTerms.length === 0) return []

    const fieldMap = { en: 'en', my: 'my', zh: 'cn' }
    const field = fieldMap[languageCode]
    if (!field) return []

    const matches = []

    for (const term of glossaryTerms) {
        const termValue = term[field]?.trim()
        if (!termValue) continue

        const pattern = languageCode === 'zh'
            ? escapeRegex(termValue)
            : `\\b${escapeRegex(termValue)}\\b`

        const regex = new RegExp(pattern, languageCode === 'zh' ? 'g' : 'gi')

        let match
        while ((match = regex.exec(text)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                term: term,
                matchedText: match[0]
            })
        }
    }

    matches.sort((a, b) => a.start - b.start)

    const filtered = []
    for (const match of matches) {
        const lastMatch = filtered[filtered.length - 1]
        if (!lastMatch || match.start >= lastMatch.end) {
            filtered.push(match)
        } else if (match.end - match.start > lastMatch.end - lastMatch.start) {
            filtered[filtered.length - 1] = match
        }
    }

    return filtered
}

// Render text with highlighted glossary matches
function HighlightedText({ text, matches }) {
    if (!text) return null
    if (!matches || matches.length === 0) {
        return <span>{text}</span>
    }

    const parts = []
    let lastIndex = 0

    for (const match of matches) {
        if (match.start > lastIndex) {
            parts.push(
                <span key={`text-${lastIndex}`}>
                    {text.slice(lastIndex, match.start)}
                </span>
            )
        }

        parts.push(
            <span
                key={`match-${match.start}`}
                className="font-semibold cursor-help hover:bg-pink-100 rounded-sm transition-colors px-0.5"
                style={{
                    color: '#FF0084'
                }}
                title={`Glossary: ${match.term.en} = ${match.term.my} / ${match.term.cn}`}
            >
                {match.matchedText}
            </span>
        )

        lastIndex = match.end
    }

    if (lastIndex < text.length) {
        parts.push(
            <span key={`text-${lastIndex}`}>
                {text.slice(lastIndex)}
            </span>
        )
    }

    return <>{parts}</>
}

export default function QuickCheck() {
    const { terms: glossaryTerms } = useGlossary()
    const { templates } = usePrompts()

    const [sourceLanguage, setSourceLanguage] = useState('en')
    const [targetLanguage, setTargetLanguage] = useState('zh')
    const [sourceText, setSourceText] = useState('')
    const [translatedText, setTranslatedText] = useState('')
    const [isTranslating, setIsTranslating] = useState(false)
    const [hasTranslated, setHasTranslated] = useState(false)

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

    // Find matches in source and target text
    const sourceMatches = useMemo(() =>
        hasTranslated ? findGlossaryMatches(sourceText, glossaryTerms, sourceLanguage) : [],
        [sourceText, glossaryTerms, sourceLanguage, hasTranslated]
    )

    const targetMatches = useMemo(() =>
        hasTranslated ? findGlossaryMatches(translatedText, glossaryTerms, targetLanguage) : [],
        [translatedText, glossaryTerms, targetLanguage, hasTranslated]
    )

    const canTranslate = sourceText.trim().length > 0 && !isTranslating

    const handleTranslate = async () => {
        if (!canTranslate) return

        setIsTranslating(true)
        setTranslatedText('')
        setHasTranslated(false)

        try {
            const results = await translateBatch(
                [{ id: 1, [sourceLanguage]: sourceText }],
                defaultTemplate,
                {
                    sourceLanguage: sourceLanguage,
                    targetLanguages: [targetLanguage],
                    glossaryTerms: glossaryTerms || []
                }
            )

            const result = results[0]
            setTranslatedText(result?.[targetLanguage] || '')
            setHasTranslated(true)

            if (result?.status === 'error') {
                toast.error('Translation failed')
            }
        } catch (error) {
            console.error('Translation error:', error)
            if (error.message === 'API_NOT_CONFIGURED') {
                toast.error('API key not configured. Check settings.')
            } else {
                toast.error('Translation failed. Please try again.')
            }
        } finally {
            setIsTranslating(false)
        }
    }

    const handleSourceChange = (e) => {
        setSourceText(e.target.value)
        setHasTranslated(false)
    }

    // Header row style matching DataTable - using TABLE_STYLES constants
    const headerStyle = {
        padding: TABLE_STYLES.headerPadding,
        backgroundColor: TABLE_STYLES.headerBg,
        borderBottom: `1px solid ${TABLE_STYLES.borderColor}`,
        fontSize: '14px',
        fontWeight: 400,
        color: TABLE_STYLES.headerText
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground">Quick Check</h1>
            </div>

            {/* Two Column Layout - Using DataTable container styling */}
            <div className={TABLE_STYLES.container} style={{ overflow: 'hidden' }}>
                <div className="grid grid-cols-2">
                    {/* Source Panel */}
                    <div className="border-r border-border/50">
                        {/* Header Row */}
                        <div className="flex items-center gap-3" style={headerStyle}>
                            <span className="whitespace-nowrap">Translate from</span>
                            <Select value={sourceLanguage} onValueChange={(val) => { setSourceLanguage(val); setHasTranslated(false); }}>
                                <SelectTrigger className="w-40 h-8 bg-transparent border-0 shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang.code} value={lang.code} disabled={lang.code === targetLanguage}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Text area */}
                        <div className="relative min-h-[280px]">
                            {/* Highlighted overlay */}
                            {hasTranslated && sourceMatches.length > 0 && (
                                <div className="absolute inset-0 p-4 pointer-events-none text-sm leading-relaxed whitespace-pre-wrap">
                                    <HighlightedText text={sourceText} matches={sourceMatches} />
                                </div>
                            )}

                            {/* Editable textarea */}
                            <textarea
                                value={sourceText}
                                onChange={handleSourceChange}
                                placeholder="Enter text to translate..."
                                className="w-full h-full min-h-[280px] p-4 bg-transparent resize-none border-none focus:ring-0 focus:outline-none text-sm leading-relaxed"
                                style={{
                                    color: hasTranslated && sourceMatches.length > 0 ? 'transparent' : 'inherit',
                                    caretColor: 'hsl(222, 47%, 11%)'
                                }}
                            />
                        </div>
                    </div>

                    {/* Target Panel */}
                    <div>
                        {/* Header Row */}
                        <div className="flex items-center gap-3" style={headerStyle}>
                            <span className="whitespace-nowrap">Translate to</span>
                            <Select value={targetLanguage} onValueChange={(val) => { setTargetLanguage(val); setHasTranslated(false); }}>
                                <SelectTrigger className="w-40 h-8 bg-transparent border-0 shadow-none">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang.code} value={lang.code} disabled={lang.code === sourceLanguage}>
                                            {lang.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Result area */}
                        <div className="min-h-[280px] p-4 text-sm leading-relaxed">
                            {isTranslating ? (
                                <div className="flex items-center text-muted-foreground">
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Translating...
                                </div>
                            ) : translatedText ? (
                                <div className="whitespace-pre-wrap">
                                    <HighlightedText text={translatedText} matches={targetMatches} />
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
            <div className="flex justify-center mt-6">
                <Button
                    onClick={handleTranslate}
                    disabled={!canTranslate}
                    className="px-6 rounded-full"
                    style={{
                        backgroundColor: canTranslate ? '#FF0084' : undefined,
                    }}
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
        </div>
    )
}
