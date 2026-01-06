// Gemini API Integration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

/**
 * Translate text using Gemini API
 * @param {string} sourceText - Text to translate
 * @param {string} targetLanguage - 'malay' or 'chinese'
 * @param {string} category - Content category for tone adjustment
 * @param {Array} glossaryTerms - Array of {english, malay, chinese} terms
 * @returns {Promise<string>} Translated text
 */
export async function translateText(sourceText, targetLanguage, category = 'general', glossaryTerms = []) {
    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env')
    }

    const glossaryContext = glossaryTerms.length > 0
        ? `\n\nGLOSSARY (use these exact translations):\n${glossaryTerms.map(t => `- "${t.english}" → "${t[targetLanguage]}"`).join('\n')}`
        : ''

    const prompt = `You are a professional translator for a Malaysian telecommunications company.

TONE REQUIREMENTS:
- Malaysian context: Use Malaysian Bahasa (not Indonesian) and Simplified Chinese with Malaysian expressions
- Professional but approachable: Official without being cold or overly formal
- Clear and logical: Prioritize clarity over literary flourish
- Marketing-aware: Preserve persuasive impact in translations

CATEGORY: ${category}
- Banner: Short, impactful, action-oriented
- Feature Header: Concise, benefit-focused  
- Feature Description: Explanatory, still punchy
- Narrative: Flow naturally, storytelling
- UI Label: Ultra-concise, clear${glossaryContext}

Translate the following from English to ${targetLanguage === 'malay' ? 'Bahasa Malaysia' : 'Simplified Chinese'}:

"${sourceText}"

Return ONLY the translated text, nothing else.`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1024,
            }
        })
    })

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

/**
 * Batch translate multiple texts
 * @param {Array} entries - Array of {id, english} objects
 * @param {string} targetLanguage - 'malay' or 'chinese'
 * @param {string} category - Content category
 * @param {Array} glossaryTerms - Glossary terms
 * @returns {Promise<Object>} Map of id -> translated text
 */
export async function batchTranslate(entries, targetLanguage, category = 'general', glossaryTerms = []) {
    const results = {}

    // Process in chunks of 5 to avoid rate limits
    const chunkSize = 5
    for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize)
        const promises = chunk.map(async (entry) => {
            try {
                const translated = await translateText(entry.english, targetLanguage, category, glossaryTerms)
                results[entry.id] = translated
            } catch (error) {
                console.error(`Translation failed for entry ${entry.id}:`, error)
                results[entry.id] = null
            }
        })
        await Promise.all(promises)

        // Small delay between chunks to respect rate limits
        if (i + chunkSize < entries.length) {
            await new Promise(resolve => setTimeout(resolve, 500))
        }
    }

    return results
}
