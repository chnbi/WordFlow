// services/firebase/glossary.js - Glossary term CRUD operations
import {
    db,
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch
} from './config'
import { defaultGlossaryTerms } from '@/data/defaults'

export async function getGlossaryTerms() {
    try {
        const q = query(collection(db, 'glossary'), orderBy('term', 'asc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Error fetching glossary terms:', error)
        return []
    }
}

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

export async function deleteGlossaryTerm(termId) {
    try {
        await deleteDoc(doc(db, 'glossary', termId))
        console.log('✅ [Firestore] Glossary term deleted:', termId)
    } catch (error) {
        console.error('Error deleting glossary term:', error)
        throw error
    }
}

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

export async function seedDefaultGlossary() {
    const existing = await getGlossaryTerms()
    if (existing.length > 0) return

    console.log('📦 [Firestore] Seeding default glossary terms...')
    for (const term of defaultGlossaryTerms) {
        await createGlossaryTerm(term)
    }
    console.log('✅ [Firestore] Seeded default glossary terms')
}

// ==========================================
// CATEGORIES
// ==========================================

export async function getGlossaryCategories() {
    try {
        const q = query(collection(db, 'glossary_categories'), orderBy('name', 'asc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
    } catch (error) {
        console.error('Error fetching categories:', error)
        return []
    }
}

export async function createGlossaryCategory(categoryData) {
    try {
        const docRef = await addDoc(collection(db, 'glossary_categories'), {
            ...categoryData,
            createdAt: serverTimestamp()
        })
        return { id: docRef.id, ...categoryData }
    } catch (error) {
        console.error('Error creating category:', error)
        throw error
    }
}

export async function deleteGlossaryCategory(id) {
    try {
        await deleteDoc(doc(db, 'glossary_categories', id))
    } catch (error) {
        console.error('Error deleting category:', error)
        throw error
    }
}
