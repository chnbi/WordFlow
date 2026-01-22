// services/pocketbase/templates.js - Prompt Template CRUD operations for PocketBase
import pb from './client'

// ==========================================
// DEFAULT TEMPLATE DEFINITION
// ==========================================
export const DEFAULT_TEMPLATE = {
    name: "Default Template",
    description: "General-purpose translation template. Always used as the base for all translations.",
    prompt: `You are a professional translator. Translate the following text accurately while maintaining the original meaning and tone.

Guidelines:
- Preserve any placeholders like {name} or {{variable}}
- Keep formatting (line breaks, punctuation) consistent
- Use natural, fluent language in the target language
- For Malay: Use Malaysian Malay (not Indonesian)
- For Chinese: Use Simplified Chinese`,
    category: "default",
    tags: ["Default", "General"],
    author: "System",
    iconName: "FileText",
    iconColor: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-100 dark:bg-slate-900/50",
    color: "bg-slate-50 dark:bg-slate-950/30",
    isDefault: true,
    status: "published"
}

// ==========================================
// TEMPLATES CRUD
// ==========================================

export async function getTemplates() {
    try {
        const records = await pb.collection('prompt_templates').getFullList({
            sort: '-created'
        })
        return records
    } catch (error) {
        console.error('Error fetching templates:', error)
        return []
    }
}

/**
 * Get or create the default template - ensures one always exists
 */
export async function getOrCreateDefaultTemplate() {
    try {
        // Get all templates and find default in code (safer than filter if field doesn't exist)
        const records = await pb.collection('prompt_templates').getFullList({
            sort: '-created'
        })

        const defaultTemplate = records.find(t => t.isDefault === true)

        if (defaultTemplate) {
            console.log('✅ [PocketBase] Default template exists:', defaultTemplate.id)
            return defaultTemplate
        }

        // No default template - create one
        console.log('📝 [PocketBase] Creating default template...')
        const created = await pb.collection('prompt_templates').create(DEFAULT_TEMPLATE)
        console.log('✅ [PocketBase] Default template created:', created.id)
        return created

    } catch (error) {
        console.error('Error getting/creating default template:', error)
        // Return the constant as fallback (won't be in DB but app can still work)
        return { ...DEFAULT_TEMPLATE, id: 'fallback-default' }
    }
}

export async function createTemplate(templateData) {
    try {
        const record = await pb.collection('prompt_templates').create({
            ...templateData,
            status: templateData.status || 'draft',
            author: templateData.author || 'You'
        })
        console.log('✅ [PocketBase] Template created:', record.id)
        return record
    } catch (error) {
        console.error('Error creating template:', error)
        throw error
    }
}

export async function updateTemplate(id, updates) {
    try {
        await pb.collection('prompt_templates').update(id, updates)
        console.log('✅ [PocketBase] Template updated:', id)
    } catch (error) {
        console.error('Error updating template:', error)
        throw error
    }
}

export async function deleteTemplate(id) {
    try {
        await pb.collection('prompt_templates').delete(id)
        console.log('✅ [PocketBase] Template deleted:', id)
    } catch (error) {
        console.error('Error deleting template:', error)
        throw error
    }
}

