// Gemini AI Service for Translation
// Uses @google/genai SDK to call Gemini API

import { GoogleGenAI } from "@google/genai";

// Initialize the client - API key from environment variable
// Uses GEMINI_API_KEY as expected by Google's SDK
const getClient = () => {
    const apiKey = import.meta.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('GEMINI_API_KEY not found in .env file.');
        return null;
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Translate a batch of rows using Gemini AI
 * @param {Array} rows - Array of row objects with {id, en/source, context}
 * @param {Object} template - Prompt template with {name, prompt}
 * @param {Object} options - Translation options {targetLanguages: ['my', 'zh']}
 * @returns {Promise<Array>} - Array of translated results
 */
export async function translateBatch(rows, template, options = {}) {
    const { targetLanguages = ['my', 'zh'] } = options;
    const startTime = Date.now();

    console.log('🚀 [Gemini API] Starting translation batch:', {
        rowCount: rows.length,
        template: template?.name || 'Default',
        targetLanguages
    });

    const ai = getClient();
    if (!ai) {
        throw new Error('API_NOT_CONFIGURED');
    }

    // Build the translation prompt
    const sourceTexts = rows.map(row => ({
        id: row.id,
        text: row.en || row.source,
        context: row.context || row.description || ''
    }));

    const prompt = buildTranslationPrompt(sourceTexts, template, targetLanguages);

    console.log('📝 [Gemini API] Prompt built, sending request...');

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        const text = response.text;
        const elapsed = Date.now() - startTime;

        console.log('✅ [Gemini API] Response received:', {
            elapsed: `${elapsed}ms`,
            responseLength: text?.length || 0
        });

        // Parse the JSON response
        const results = parseTranslationResponse(text, rows);

        console.log('📦 [Gemini API] Parsed results:', {
            successCount: results.filter(r => r.status === 'review').length,
            errorCount: results.filter(r => r.status === 'error').length
        });

        return results;

    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error('❌ [Gemini API] Error after', elapsed, 'ms:', error);

        // Check for rate limit error
        if (error.status === 429 || error.message?.includes('429')) {
            console.warn('⏳ [Gemini API] Rate limited, will retry...');
            throw new Error('RATE_LIMIT');
        }

        throw error;
    }
}

/**
 * Build the translation prompt with template and context
 */
function buildTranslationPrompt(sourceTexts, template, targetLanguages) {
    const languageNames = {
        'my': 'Bahasa Malaysia (Malay)',
        'zh': 'Simplified Chinese (中文)'
    };

    const targetLangStr = targetLanguages.map(l => languageNames[l] || l).join(' and ');

    // Use template prompt or default
    const styleInstruction = template?.prompt ||
        'Translate accurately while maintaining the original meaning and tone.';

    const prompt = `You are a professional translator. Translate the following texts from English to ${targetLangStr}.

## Style Guidelines
${styleInstruction}

## Input
I will provide you with a JSON array of objects. Each object has:
- "id": A unique identifier (return this unchanged)
- "text": The English text to translate
- "context": Optional context about where this text is used

\`\`\`json
${JSON.stringify(sourceTexts, null, 2)}
\`\`\`

## Output Format
Return a JSON array with the same "id" values, plus translations for each target language.
Use these exact keys: ${targetLanguages.map(l => `"${l}"`).join(', ')}

Example output format:
\`\`\`json
[
  {"id": 1, "my": "Malay translation here", "zh": "中文翻译在这里"},
  {"id": 2, "my": "...", "zh": "..."}
]
\`\`\`

IMPORTANT: 
- Return ONLY the JSON array, no other text
- Preserve any placeholders like {name} or {{variable}} exactly as they appear
- Maintain the same formatting (e.g., if source has line breaks, keep them)`;

    return prompt;
}

/**
 * Parse the translation response from Gemini
 */
function parseTranslationResponse(responseText, originalRows) {
    try {
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = responseText;

        // Remove markdown code blocks if present
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr.trim());

        // Merge with original row data
        return originalRows.map(row => {
            const translation = parsed.find(t => t.id === row.id);
            return {
                id: row.id,
                my: translation?.my || '',
                zh: translation?.zh || '',
                status: 'review',
                translatedAt: new Date().toISOString(),
            };
        });

    } catch (error) {
        console.error('Failed to parse translation response:', error);
        console.error('Raw response:', responseText);

        // Return error status for all rows
        return originalRows.map(row => ({
            id: row.id,
            status: 'error',
            errorMessage: 'Failed to parse AI response'
        }));
    }
}

/**
 * Test the API connection
 */
export async function testConnection() {
    try {
        const ai = getClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: "Say 'API connection successful' in exactly those words.",
        });
        return { success: true, message: response.text };
    } catch (error) {
        return { success: false, message: error.message };
    }
}
