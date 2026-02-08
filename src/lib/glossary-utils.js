
/**
 * Utility functions for glossary matching and highlighting
 */

// Escape special regex characters
export function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Find glossary matches in text
 * @param {string} text - The text to search in
 * @param {Array} glossaryTerms - List of glossary terms
 * @param {string} languageCode - Language code to check (en, my, zh)
 * @returns {Array} List of matches with start, end, term, matchedText
 */
export function findGlossaryMatches(text, glossaryTerms, languageCode) {
    if (!text || !glossaryTerms || glossaryTerms.length === 0) return []

    // Map language codes to possible field names (check multiple)
    const fieldMap = {
        en: ['en', 'english'],
        my: ['my', 'malay'],
        zh: ['cn', 'chinese', 'zh']
    }
    const fields = fieldMap[languageCode]
    if (!fields) return []

    const matches = []

    // We don't track "notFound" here as that's specific to QuickCheck reporting
    // but we could if needed. For strictly finding matches:

    for (const term of glossaryTerms) {
        // Try multiple field names
        let termValue = null
        for (const field of fields) {
            if (term[field]?.trim()) {
                termValue = term[field].trim()
                break
            }
        }

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

    // Remove overlapping matches (greedy approach - keep first/longest)
    // Simple approach: if overlap, keep the one that starts earlier or is longer
    const filtered = []
    for (const match of matches) {
        const lastMatch = filtered[filtered.length - 1]
        if (!lastMatch || match.start >= lastMatch.end) {
            filtered.push(match)
        } else if (match.end - match.start > lastMatch.end - lastMatch.start) {
            // If current match is longer and overlaps, replace previous?
            // "Hello World" vs "Hello". "Hello World" match covers "Hello".
            // If we sorted by start, "Hello" might come before "Hello World"?
            // Actually regex exec order depends on loop order.
            // Better to match longest terms first?
            // For now, keep original logic from QuickCheck.jsx
            filtered[filtered.length - 1] = match
        }
    }

    return filtered
}
