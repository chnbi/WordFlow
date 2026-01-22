// services/pocketbase/audit.js - Audit Trail operations for PocketBase
import pb from './client'

// Action types for consistency
export const AUDIT_ACTIONS = {
    // Translations
    TRANSLATED_AI: 'TRANSLATED_AI',
    TRANSLATED_MANUAL: 'TRANSLATED_MANUAL',
    EDITED: 'EDITED',

    // Workflow
    SENT_FOR_REVIEW: 'SENT_FOR_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',

    // Projects
    PROJECT_CREATED: 'PROJECT_CREATED',
    PROJECT_DELETED: 'PROJECT_DELETED',
    PAGE_ADDED: 'PAGE_ADDED',
    PAGE_DELETED: 'PAGE_DELETED',
    ROWS_IMPORTED: 'ROWS_IMPORTED',
    ROWS_EXPORTED: 'ROWS_EXPORTED',

    // Glossary
    GLOSSARY_ADDED: 'GLOSSARY_ADDED',
    GLOSSARY_EDITED: 'GLOSSARY_EDITED',
    GLOSSARY_DELETED: 'GLOSSARY_DELETED',

    // Prompts
    PROMPT_CREATED: 'PROMPT_CREATED',
    PROMPT_EDITED: 'PROMPT_EDITED',
    PROMPT_PUBLISHED: 'PROMPT_PUBLISHED',
}

/**
 * Log an action to the audit trail
 */
export async function logAction(user, action, entityType, entityId, options = {}) {
    if (!user?.id && !user?.uid) {
        console.warn('[Audit] No user provided, skipping log')
        return null
    }

    try {
        const record = await pb.collection('audit_logs').create({
            userId: user.id || user.uid,
            userEmail: user.email || 'unknown',
            action,
            entityType,
            entityId,
            projectId: options.projectId || '',
            content: options.content || null,
            metadata: options.metadata || null,
        })
        console.log(`[Audit] Logged: ${action} on ${entityType}/${entityId}`)
        return record.id
    } catch (error) {
        console.error('[Audit] Failed to log action:', error)
        return null
    }
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityHistory(entityType, entityId, maxResults = 50) {
    try {
        const records = await pb.collection('audit_logs').getList(1, maxResults, {
            filter: `entityType = "${entityType}" && entityId = "${entityId}"`,
            sort: '-created'
        })
        return records.items.map(record => ({
            ...record,
            timestamp: new Date(record.created)
        }))
    } catch (error) {
        console.error('[Audit] Failed to get entity history:', error)
        return []
    }
}

/**
 * Get recent activity for a project
 */
export async function getProjectActivity(projectId, maxResults = 20) {
    try {
        const records = await pb.collection('audit_logs').getList(1, maxResults, {
            filter: `projectId = "${projectId}"`,
            sort: '-created'
        })
        return records.items.map(record => ({
            ...record,
            timestamp: new Date(record.created)
        }))
    } catch (error) {
        console.error('[Audit] Failed to get project activity:', error)
        return []
    }
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(filters = {}, maxResults = 100) {
    try {
        let filterParts = []
        if (filters.projectId) filterParts.push(`projectId = "${filters.projectId}"`)
        if (filters.userId) filterParts.push(`userId = "${filters.userId}"`)
        if (filters.action) filterParts.push(`action = "${filters.action}"`)

        const records = await pb.collection('audit_logs').getList(1, maxResults, {
            filter: filterParts.length > 0 ? filterParts.join(' && ') : '',
            sort: '-created'
        })

        return records.items.map(record => ({
            ...record,
            timestamp: new Date(record.created)
        }))
    } catch (error) {
        console.error('[Audit] Failed to get audit logs:', error)
        return []
    }
}

/**
 * Format action for display
 */
export function formatAction(action) {
    const labels = {
        TRANSLATED_AI: 'AI translated',
        TRANSLATED_MANUAL: 'Manually translated',
        EDITED: 'Edited',
        SENT_FOR_REVIEW: 'Sent for review',
        APPROVED: 'Approved',
        REJECTED: 'Rejected',
        PROJECT_CREATED: 'Created project',
        PROJECT_DELETED: 'Deleted project',
        PAGE_ADDED: 'Added page',
        PAGE_DELETED: 'Deleted page',
        ROWS_IMPORTED: 'Imported rows',
        ROWS_EXPORTED: 'Exported rows',
        GLOSSARY_ADDED: 'Added term',
        GLOSSARY_EDITED: 'Edited term',
        GLOSSARY_DELETED: 'Deleted term',
        PROMPT_CREATED: 'Created prompt',
        PROMPT_EDITED: 'Edited prompt',
        PROMPT_PUBLISHED: 'Published prompt',
    }
    return labels[action] || action
}

/**
 * Format relative time
 */
export function formatRelativeTime(date) {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
}
