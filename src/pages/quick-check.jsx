// Quick Check - Translation tool with glossary highlighting
import { useState, useMemo } from "react"
import { useGlossary } from "@/context/GlossaryContext"
import { usePrompts } from "@/context/PromptContext"
import { translateBatch } from "@/services/gemini/text"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

const LANGUAGES = [
    { code: 'en', name: 'English', field: 'english' },
    { code: 'my', name: 'Bahasa Malaysia', field: 'malay' },
    { code: 'zh', name: 'Chinese', field: 'chinese' },
]

// Escape special regex characters
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Find glossary matches in text
function findGlossaryMatches(text, glossaryTerms, languageCode) {
    if (!text || !glossaryTerms || glossaryTerms.length === 0) return []

    const lang = LANGUAGES.find(l => l.code === languageCode)
    if (!lang) return []

    const matches = []

    for (const term of glossaryTerms) {
        const termValue = term[lang.field]
        if (!termValue) continue

        // Word boundaries for EN, exact match for ZH
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

    // Sort by position
    matches.sort((a, b) => a.start - b.start)

    // Remove overlapping matches (keep longer ones)
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
function HighlightedText({ text, matches, hoveredTermId, onHover }) {
    if (!text) return null
    if (!matches || matches.length === 0) {
        return <span>{text}</span>
    }

    const parts = []
    let lastIndex = 0

    for (const match of matches) {
        // Add text before match
        if (match.start > lastIndex) {
            parts.push(
                <span key={`text-${lastIndex}`}>
                    {text.slice(lastIndex, match.start)}
                </span>
            )
        }

        // Add highlighted match
        const isHovered = hoveredTermId === match.term.id
        parts.push(
            <span
                key={`match-${match.start}`}
                onMouseEnter={() => onHover(match.term.id)}
                onMouseLeave={() => onHover(null)}
                style={{
                    color: '#FF0084',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: isHovered ? '#FFB9DD' : 'transparent',
                    borderRadius: isHovered ? '4px' : 0,
                    padding: isHovered ? '0 2px' : 0,
                    transition: 'background-color 0.15s ease',
                }}
            >
                {match.matchedText}
            </span>
        )

        lastIndex = match.end
    }

    // Add remaining text
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
    const [targetLanguage, setTargetLanguage] = useState('my')
    const [sourceText, setSourceText] = useState('')
    const [translatedText, setTranslatedText] = useState('')
    const [isTranslating, setIsTranslating] = useState(false)
    const [hoveredTermId, setHoveredTermId] = useState(null)
    const [hasTranslated, setHasTranslated] = useState(false) // Track if translation was done

    // Get default template (exclude drafts - only published or review status)
    const defaultTemplate = useMemo(() => {
        const publishedTemplates = templates?.filter(t => t.status !== 'draft') || []
        return publishedTemplates.find(t => t.isDefault) ||
            publishedTemplates[0] ||
        {
            name: 'Default',
            prompt: 'Translate accurately while maintaining the original meaning and tone.'
        }
    }, [templates])

    // Find matches in source and target text (only used after translation)
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
                [{ id: 1, en: sourceText }],
                defaultTemplate,
                {
                    targetLanguages: [targetLanguage],
                    glossaryTerms: glossaryTerms || []
                }
            )

            const result = results[0]
            setTranslatedText(result?.[targetLanguage] || '')
            setHasTranslated(true) // Enable highlighting after translation

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
        // Reset translation state when source changes
        setHasTranslated(false)
        setTranslatedText('')
    }

    const handleSwapLanguages = () => {
        setSourceLanguage(targetLanguage)
        setTargetLanguage(sourceLanguage)
        setSourceText(translatedText)
        setTranslatedText(sourceText)
        setHasTranslated(false)
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">Quick Check</h1>
                <p className="text-muted-foreground">
                    Translate text and check glossary term usage
                </p>
            </div>

            {/* Language Selectors */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                        Source Language
                    </label>
                    <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                        <SelectTrigger>
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

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSwapLanguages}
                    className="mt-6"
                    title="Swap languages"
                >
                    ⇄
                </Button>

                <div className="flex-1">
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">
                        Target Language
                    </label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger>
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
            </div>

            {/* Input/Output Areas - BIGGER BOXES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Source - Show highlighted version after translate, textarea before */}
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Source Text
                    </label>
                    {hasTranslated && sourceMatches.length > 0 ? (
                        // After translation: show highlighted text in a styled box
                        <div
                            className="min-h-[300px] p-4 border rounded-lg bg-background text-foreground leading-relaxed"
                            style={{ whiteSpace: 'pre-wrap' }}
                        >
                            <HighlightedText
                                text={sourceText}
                                matches={sourceMatches}
                                hoveredTermId={hoveredTermId}
                                onHover={setHoveredTermId}
                            />
                        </div>
                    ) : (
                        // Before translation: show editable textarea
                        <textarea
                            value={sourceText}
                            onChange={handleSourceChange}
                            placeholder="Enter text to translate..."
                            className="w-full min-h-[300px] p-4 border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                        />
                    )}
                </div>

                {/* Target */}
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Translation
                    </label>
                    <div
                        className="min-h-[300px] p-4 border rounded-lg bg-muted/30 leading-relaxed"
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {isTranslating ? (
                            <div className="flex items-center justify-center h-full min-h-[268px] text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Translating...
                            </div>
                        ) : translatedText ? (
                            <HighlightedText
                                text={translatedText}
                                matches={targetMatches}
                                hoveredTermId={hoveredTermId}
                                onHover={setHoveredTermId}
                            />
                        ) : (
                            <span className="text-muted-foreground">
                                Translation will appear here...
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Translate Button */}
            <div className="flex justify-center mb-6">
                <Button
                    onClick={handleTranslate}
                    disabled={!canTranslate}
                    className="px-10 py-6 text-base"
                    style={{
                        backgroundColor: canTranslate ? '#FF0084' : undefined,
                    }}
                >
                    {isTranslating ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Translating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 mr-2" />
                            Translate
                        </>
                    )}
                </Button>
            </div>

            {/* Glossary Legend - Only show after translation */}
            {hasTranslated && (sourceMatches.length > 0 || targetMatches.length > 0) && (
                <div className="p-4 border rounded-lg bg-card">
                    <h3 className="font-medium mb-2">Glossary Matches</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        <span style={{ color: '#FF0084', fontWeight: 600 }}>Pink text</span> indicates glossary terms.
                        Hover to highlight the corresponding term in both languages.
                    </p>
                    <div className="text-xs text-muted-foreground">
                        {sourceMatches.length} term(s) in source • {targetMatches.length} term(s) in translation
                    </div>
                </div>
            )}

            {/* Edit button to go back to editing mode */}
            {hasTranslated && (
                <div className="flex justify-center mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setHasTranslated(false)}
                    >
                        Edit Source Text
                    </Button>
                </div>
            )}
        </div>
    )
}
