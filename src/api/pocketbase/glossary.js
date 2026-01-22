// services/pocketbase/glossary.js - Glossary CRUD operations for PocketBase
import pb from './client'

// ==========================================
// GLOSSARY TERMS
// ==========================================

export async function getGlossaryTerms() {
    try {
        const records = await pb.collection('glossary_terms').getFullList({
            sort: '-created'
        })
        return records
    } catch (error) {
        console.error('Error fetching glossary terms:', error)
        return []
    }
}

export async function getApprovedGlossaryTerms() {
    try {
        const records = await pb.collection('glossary_terms').getFullList({
            filter: 'status = "approved"',
            sort: '-created'
        })
        return records
    } catch (error) {
        console.error('Error fetching approved glossary terms:', error)
        return []
    }
}

export async function createGlossaryTerm(termData) {
    try {
        const record = await pb.collection('glossary_terms').create({
            ...termData,
            status: termData.status || 'draft'
        })
        console.log('✅ [PocketBase] Glossary term created:', record.id)
        return record
    } catch (error) {
        console.error('Error creating glossary term:', error)
        throw error
    }
}

export async function createGlossaryTerms(termsArray) {
    try {
        const results = []
        for (const term of termsArray) {
            const record = await pb.collection('glossary_terms').create({
                ...term,
                status: term.status || 'draft'
            })
            results.push(record)
        }
        console.log('✅ [PocketBase] Created', results.length, 'glossary terms')
        return results
    } catch (error) {
        console.error('Error creating glossary terms:', error)
        throw error
    }
}

export async function updateGlossaryTerm(id, updates) {
    try {
        await pb.collection('glossary_terms').update(id, updates)
        console.log('✅ [PocketBase] Glossary term updated:', id)
    } catch (error) {
        console.error('Error updating glossary term:', error)
        throw error
    }
}

export async function deleteGlossaryTerm(id) {
    try {
        await pb.collection('glossary_terms').delete(id)
        console.log('✅ [PocketBase] Glossary term deleted:', id)
    } catch (error) {
        console.error('Error deleting glossary term:', error)
        throw error
    }
}

export async function deleteGlossaryTerms(ids) {
    try {
        for (const id of ids) {
            await pb.collection('glossary_terms').delete(id)
        }
        console.log('✅ [PocketBase] Deleted', ids.length, 'glossary terms')
    } catch (error) {
        console.error('Error deleting glossary terms:', error)
        throw error
    }
}

// Placeholder for seeding (not typically needed with PocketBase)
export async function seedDefaultGlossary() {
    console.log('📦 [PocketBase] Seed function called - use Admin UI to seed data')
}

// ==========================================
// GLOSSARY CATEGORIES
// ==========================================

export async function getGlossaryCategories() {
    try {
        const records = await pb.collection('glossary_categories').getFullList({
            sort: 'name'
        })
        return records
    } catch (error) {
        console.error('Error fetching glossary categories:', error)
        return []
    }
}

export async function createGlossaryCategory(categoryData) {
    try {
        const record = await pb.collection('glossary_categories').create(categoryData)
        console.log('✅ [PocketBase] Category created:', record.id)
        return record
    } catch (error) {
        console.error('Error creating category:', error)
        throw error
    }
}

export async function deleteGlossaryCategory(id) {
    try {
        await pb.collection('glossary_categories').delete(id)
        console.log('✅ [PocketBase] Category deleted:', id)
    } catch (error) {
        console.error('Error deleting category:', error)
        throw error
    }
}
