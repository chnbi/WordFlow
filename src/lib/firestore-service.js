// Firestore Service - CRUD operations for projects, rows, and templates
import { db } from './firebase'
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    setDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore'

// ==========================================
// PROJECTS
// ==========================================

/**
 * Get all projects
 */
export async function getProjects() {
    try {
        // Note: No orderBy to support docs without createdAt field
        const snapshot = await getDocs(collection(db, 'projects'))
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
            lastUpdated: doc.data().lastUpdated?.toDate?.()?.toISOString() || null
        }))
    } catch (error) {
        console.error('Error fetching projects:', error)
        return []
    }
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId) {
    try {
        const docRef = doc(db, 'projects', projectId)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
                createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || null,
                lastUpdated: docSnap.data().lastUpdated?.toDate?.()?.toISOString() || null
            }
        }
        return null
    } catch (error) {
        console.error('Error fetching project:', error)
        return null
    }
}

/**
 * Create a new project
 */
export async function createProject(projectData) {
    try {
        const docRef = await addDoc(collection(db, 'projects'), {
            ...projectData,
            status: projectData.status || 'draft',
            createdAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
        })
        console.log('✅ [Firestore] Project created:', docRef.id)
        return { id: docRef.id, ...projectData }
    } catch (error) {
        console.error('Error creating project:', error)
        throw error
    }
}

/**
 * Update a project
 */
export async function updateProject(projectId, updates) {
    try {
        const docRef = doc(db, 'projects', projectId)
        await updateDoc(docRef, {
            ...updates,
            lastUpdated: serverTimestamp()
        })
        console.log('✅ [Firestore] Project updated:', projectId)
    } catch (error) {
        console.error('Error updating project:', error)
        throw error
    }
}

/**
 * Delete a project and its rows
 */
export async function deleteProject(projectId) {
    try {
        // Delete all rows first
        const rowsSnapshot = await getDocs(collection(db, 'projects', projectId, 'rows'))
        const batch = writeBatch(db)
        rowsSnapshot.docs.forEach(doc => batch.delete(doc.ref))

        // Delete project
        batch.delete(doc(db, 'projects', projectId))
        await batch.commit()

        console.log('✅ [Firestore] Project deleted:', projectId)
    } catch (error) {
        console.error('Error deleting project:', error)
        throw error
    }
}

// ==========================================
// PROJECT PAGES
// ==========================================

/**
 * Get all pages for a project
 */
export async function getProjectPages(projectId) {
    try {
        const q = query(
            collection(db, 'projects', projectId, 'pages'),
            orderBy('order', 'asc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Error fetching project pages:', error)
        return []
    }
}

/**
 * Add a page to a project
 */
export async function addProjectPage(projectId, pageData) {
    try {
        // Get current page count for ordering
        const pages = await getProjectPages(projectId)
        const order = pages.length

        const docRef = await addDoc(collection(db, 'projects', projectId, 'pages'), {
            ...pageData,
            order,
            createdAt: serverTimestamp()
        })
        console.log('✅ [Firestore] Page created:', docRef.id)
        return { id: docRef.id, ...pageData, order }
    } catch (error) {
        console.error('Error creating page:', error)
        throw error
    }
}

/**
 * Delete a page and its rows
 */
export async function deleteProjectPage(projectId, pageId) {
    try {
        // Delete all rows in the page first
        const rowsSnapshot = await getDocs(collection(db, 'projects', projectId, 'pages', pageId, 'rows'))
        const batch = writeBatch(db)
        rowsSnapshot.docs.forEach(doc => batch.delete(doc.ref))

        // Delete page
        batch.delete(doc(db, 'projects', projectId, 'pages', pageId))
        await batch.commit()

        console.log('✅ [Firestore] Page deleted:', pageId)
    } catch (error) {
        console.error('Error deleting page:', error)
        throw error
    }
}

// ==========================================
// PAGE ROWS (rows within a page)
// ==========================================

/**
 * Get all rows for a page
 */
export async function getPageRows(projectId, pageId) {
    try {
        const q = query(
            collection(db, 'projects', projectId, 'pages', pageId, 'rows'),
            orderBy('order', 'asc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Error fetching page rows:', error)
        return []
    }
}

/**
 * Add multiple rows to a page (for Excel import)
 */
export async function addPageRows(projectId, pageId, rows) {
    try {
        const batch = writeBatch(db)
        const rowsRef = collection(db, 'projects', projectId, 'pages', pageId, 'rows')

        rows.forEach((row, index) => {
            const newDocRef = doc(rowsRef)
            batch.set(newDocRef, {
                ...row,
                id: newDocRef.id,
                order: index,
                status: row.status || 'pending',
                createdAt: serverTimestamp()
            })
        })

        await batch.commit()
        console.log('✅ [Firestore] Added', rows.length, 'rows to page:', pageId)

        // Update project lastUpdated
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error adding page rows:', error)
        throw error
    }
}

/**
 * Update a single row in a page
 */
export async function updatePageRow(projectId, pageId, rowId, updates) {
    try {
        const docRef = doc(db, 'projects', projectId, 'pages', pageId, 'rows', rowId)
        await updateDoc(docRef, updates)
        console.log('✅ [Firestore] Row updated:', rowId)

        // Update project lastUpdated
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating row:', error)
        throw error
    }
}

/**
 * Update multiple rows in a page (creates if doesn't exist)
 */
export async function updatePageRows(projectId, pageId, rowUpdates) {
    try {
        const batch = writeBatch(db)

        rowUpdates.forEach(({ id, changes }) => {
            const docRef = doc(db, 'projects', projectId, 'pages', pageId, 'rows', id)
            batch.set(docRef, { ...changes, id }, { merge: true })
        })

        await batch.commit()
        console.log('✅ [Firestore] Updated', rowUpdates.length, 'rows in page:', pageId)

        // Update project lastUpdated
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating page rows:', error)
        throw error
    }
}

// ==========================================
// LEGACY: PROJECT ROWS (flat structure - for backward compatibility)
// ==========================================

/**
 * Get all rows for a project (flat structure - legacy)
 */
export async function getProjectRows(projectId) {
    try {
        const q = query(
            collection(db, 'projects', projectId, 'rows'),
            orderBy('order', 'asc')
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Error fetching project rows:', error)
        return []
    }
}

/**
 * Add multiple rows to a project (flat structure - legacy)
 */
export async function addProjectRows(projectId, rows) {
    try {
        const batch = writeBatch(db)
        const rowsRef = collection(db, 'projects', projectId, 'rows')

        rows.forEach((row, index) => {
            const newDocRef = doc(rowsRef)
            batch.set(newDocRef, {
                ...row,
                id: newDocRef.id,
                order: index,
                status: row.status || 'pending',
                createdAt: serverTimestamp()
            })
        })

        await batch.commit()
        console.log('✅ [Firestore] Added', rows.length, 'rows to project:', projectId)

        // Update project lastUpdated
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error adding rows:', error)
        throw error
    }
}

/**
 * Update a single row
 */
export async function updateProjectRow(projectId, rowId, updates) {
    try {
        const docRef = doc(db, 'projects', projectId, 'rows', rowId)
        await updateDoc(docRef, updates)
        console.log('✅ [Firestore] Row updated:', rowId)

        // Update project lastUpdated
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating row:', error)
        throw error
    }
}

/**
 * Update multiple rows at once (creates if doesn't exist)
 */
export async function updateProjectRows(projectId, rowUpdates) {
    try {
        const batch = writeBatch(db)

        rowUpdates.forEach(({ id, changes }) => {
            const docRef = doc(db, 'projects', projectId, 'rows', id)
            // Use set with merge to create if doesn't exist
            batch.set(docRef, { ...changes, id }, { merge: true })
        })

        await batch.commit()
        console.log('✅ [Firestore] Updated', rowUpdates.length, 'rows')

        // Update project lastUpdated
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating rows:', error)
        throw error
    }
}

// ==========================================
// TEMPLATES
// ==========================================

/**
 * Get all prompt templates
 */
export async function getTemplates() {
    try {
        const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Error fetching templates:', error)
        return []
    }
}

/**
 * Create a new template
 */
export async function createTemplate(templateData) {
    try {
        const docRef = await addDoc(collection(db, 'templates'), {
            ...templateData,
            createdAt: serverTimestamp()
        })
        console.log('✅ [Firestore] Template created:', docRef.id)
        return { id: docRef.id, ...templateData }
    } catch (error) {
        console.error('Error creating template:', error)
        throw error
    }
}

/**
 * Update a template
 */
export async function updateTemplate(templateId, updates) {
    try {
        const docRef = doc(db, 'templates', templateId)
        await updateDoc(docRef, updates)
        console.log('✅ [Firestore] Template updated:', templateId)
    } catch (error) {
        console.error('Error updating template:', error)
        throw error
    }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId) {
    try {
        await deleteDoc(doc(db, 'templates', templateId))
        console.log('✅ [Firestore] Template deleted:', templateId)
    } catch (error) {
        console.error('Error deleting template:', error)
        throw error
    }
}

// ==========================================
// INITIALIZATION (Seed default templates)
// ==========================================

/**
 * Seed default templates if none exist
 */
export async function seedDefaultTemplates() {
    const existing = await getTemplates()
    if (existing.length > 0) return // Already seeded

    const defaults = [
        {
            name: 'Formal Business',
            prompt: 'Translate in a formal, professional business tone. Use proper grammar and avoid colloquialisms.',
            tags: ['formal', 'business'],
            category: 'business'
        },
        {
            name: 'Marketing Copy',
            prompt: 'Translate with persuasive, engaging marketing language. Keep it punchy and action-oriented.',
            tags: ['marketing', 'creative'],
            category: 'marketing'
        },
        {
            name: 'Technical Documentation',
            prompt: 'Translate technical content accurately. Preserve technical terms and maintain clarity.',
            tags: ['technical', 'documentation'],
            category: 'technical'
        },
        {
            name: 'Casual Friendly',
            prompt: 'Translate in a casual, friendly tone suitable for social media or informal communication.',
            tags: ['casual', 'social'],
            category: 'social'
        }
    ]

    for (const template of defaults) {
        await createTemplate(template)
    }
    console.log('✅ [Firestore] Seeded default templates')
}

// ==========================================
// GLOSSARY
// ==========================================

/**
 * Get all glossary terms
 */
export async function getGlossaryTerms() {
    try {
        const snapshot = await getDocs(collection(db, 'glossary'))
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Error fetching glossary terms:', error)
        return []
    }
}

/**
 * Create a new glossary term
 */
export async function createGlossaryTerm(termData) {
    try {
        const docRef = await addDoc(collection(db, 'glossary'), {
            ...termData,
            createdAt: serverTimestamp(),
            lastModified: serverTimestamp()
        })
        console.log('✅ [Firestore] Glossary term created:', docRef.id)
        return { id: docRef.id, ...termData }
    } catch (error) {
        console.error('Error creating glossary term:', error)
        throw error
    }
}

/**
 * Update a glossary term
 */
export async function updateGlossaryTerm(termId, updates) {
    try {
        const docRef = doc(db, 'glossary', termId)
        await updateDoc(docRef, {
            ...updates,
            lastModified: serverTimestamp()
        })
        console.log('✅ [Firestore] Glossary term updated:', termId)
    } catch (error) {
        console.error('Error updating glossary term:', error)
        throw error
    }
}

/**
 * Delete a glossary term
 */
export async function deleteGlossaryTerm(termId) {
    try {
        await deleteDoc(doc(db, 'glossary', termId))
        console.log('✅ [Firestore] Glossary term deleted:', termId)
    } catch (error) {
        console.error('Error deleting glossary term:', error)
        throw error
    }
}

/**
 * Delete multiple glossary terms
 */
export async function deleteGlossaryTerms(termIds) {
    try {
        const batch = writeBatch(db)
        termIds.forEach(id => {
            batch.delete(doc(db, 'glossary', id))
        })
        await batch.commit()
        console.log('✅ [Firestore] Deleted', termIds.length, 'glossary terms')
    } catch (error) {
        console.error('Error deleting glossary terms:', error)
        throw error
    }
}

/**
 * Seed default glossary terms if none exist
 */
export async function seedDefaultGlossary() {
    const existing = await getGlossaryTerms()
    if (existing.length > 0) return // Already seeded

    const defaults = [
        {
            term: 'Translation Memory',
            english: 'Translation Memory',
            malay: 'Memori Terjemahan',
            chinese: '翻译记忆',
            category: 'Technical',
            description: 'A database of previously translated text segments'
        },
        {
            term: 'Localization',
            english: 'Localization',
            malay: 'Penyetempatan',
            chinese: '本地化',
            category: 'Technical',
            description: 'Adapting content for specific markets'
        }
    ]

    for (const term of defaults) {
        await createGlossaryTerm(term)
    }
    console.log('✅ [Firestore] Seeded default glossary terms')
}
