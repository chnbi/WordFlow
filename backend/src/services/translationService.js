const { GoogleGenerativeAI } = require('@google/generative-ai');
const Glossary = require('../models/Glossary');

class TranslationService {
  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
    } else {
      console.warn('⚠️ Gemini API not configured. Translation will use mock data.');
      this.model = null;
    }
  }

  async translateText(sourceText, sourceLang, targetLang, glossaryVersion = 'v1.0') {
    try {
      // Fetch active glossary terms
      const glossaryTerms = await Glossary.find({
        version: glossaryVersion,
        isActive: true
      });

      if (!this.model) {
        // Return mock translation for development
        return this.getMockTranslation(sourceText, targetLang, glossaryTerms);
      }

      // Build glossary context
      const glossaryContext = this.buildGlossaryPrompt(glossaryTerms, targetLang);

      // Create translation prompt
      const prompt = this.buildTranslationPrompt(
        sourceText,
        sourceLang,
        targetLang,
        glossaryContext
      );

      // Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const translation = response.text().trim();

      // Validate glossary usage
      const validation = this.validateGlossaryUsage(
        sourceText,
        translation,
        glossaryTerms,
        targetLang
      );

      return {
        translation,
        glossaryMatches: validation.matches,
        warnings: validation.warnings,
        success: true
      };
    } catch (error) {
      console.error('Translation Error:', error);
      return {
        translation: '',
        glossaryMatches: [],
        warnings: [`Translation failed: ${error.message}`],
        success: false
      };
    }
  }

  buildTranslationPrompt(sourceText, sourceLang, targetLang, glossaryContext) {
    const langMap = {
      en: 'English',
      bm: 'Bahasa Malaysia (Malay)',
      zh: 'Chinese (Simplified)'
    };

    return `You are a professional translator for YTL Communications, a telecommunications company.

Translate the following text from ${langMap[sourceLang]} to ${langMap[targetLang]}.

MANDATORY GLOSSARY TERMS (use these translations exactly):
${glossaryContext}

SOURCE TEXT:
"${sourceText}"

RULES:
1. Use glossary terms EXACTLY as specified above
2. Maintain professional telecommunications industry tone
3. Keep formatting, punctuation, and capitalization appropriate
4. Be concise - match the brevity of the source if it's short
5. Return ONLY the translation, no explanations or notes

TRANSLATION:`;
  }

  buildGlossaryPrompt(glossaryTerms, targetLang) {
    if (!glossaryTerms || glossaryTerms.length === 0) {
      return 'None';
    }

    return glossaryTerms
      .map(term => {
        const translation = term[targetLang];
        const note = term.doNotTranslate ? ' (DO NOT TRANSLATE - keep as-is)' : '';
        return `- "${term.en}" → "${translation}"${note}`;
      })
      .join('\n');
  }

  validateGlossaryUsage(sourceText, translation, glossaryTerms, targetLang) {
    const matches = [];
    const warnings = [];

    glossaryTerms.forEach(term => {
      // Check if source contains the English term (case-insensitive)
      const sourceContainsTerm = sourceText.toLowerCase().includes(term.en.toLowerCase());

      if (sourceContainsTerm) {
        const expectedTranslation = term[targetLang];

        // Check if translation uses the correct glossary term
        if (translation.includes(expectedTranslation)) {
          matches.push(term.en);
        } else {
          // Warn if glossary term wasn't used correctly
          warnings.push(
            `"${term.en}" should be translated as "${expectedTranslation}"`
          );
        }
      }
    });

    return { matches, warnings };
  }

  async batchTranslate(items, sourceLang, targetLang, glossaryVersion = 'v1.0') {
    const results = [];
    const BATCH_SIZE = 5; // Process 5 at a time to avoid rate limits

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(item =>
        this.translateText(item.text, sourceLang, targetLang, glossaryVersion)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + BATCH_SIZE < items.length) {
        await this.delay(1000);
      }
    }

    return results;
  }

  getMockTranslation(sourceText, targetLang, glossaryTerms) {
    // Simple mock translations
    const mockTranslations = {
      bm: {
        'Get 5G Now': 'Dapatkan 5G Sekarang',
        'Sign Up': 'Daftar',
        'Unlimited Data': 'Data Tanpa Had',
        'Premium Plan': 'Pelan Premium',
        'Yes': 'Yes'
      },
      zh: {
        'Get 5G Now': '立即获取5G',
        'Sign Up': '注册',
        'Unlimited Data': '无限数据',
        'Premium Plan': '高级套餐',
        'Yes': 'Yes'
      }
    };

    const translation = mockTranslations[targetLang]?.[sourceText] ||
                       `[${targetLang.toUpperCase()}] ${sourceText}`;

    // Find matching glossary terms
    const matches = glossaryTerms
      .filter(term => sourceText.toLowerCase().includes(term.en.toLowerCase()))
      .map(term => term.en);

    return {
      translation,
      glossaryMatches: matches,
      warnings: [],
      success: true,
      message: 'Mock translation (Gemini API not configured)'
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async findGlossaryTerms(text, glossaryVersion = 'v1.0') {
    const glossaryTerms = await Glossary.find({
      version: glossaryVersion,
      isActive: true
    });

    const foundTerms = glossaryTerms.filter(term =>
      text.toLowerCase().includes(term.en.toLowerCase())
    );

    return foundTerms.map(term => term.en);
  }
}

module.exports = new TranslationService();
