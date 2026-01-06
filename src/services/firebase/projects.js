// services/firebase/projects.js - Project and Page CRUD operations
import {
    db,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    writeBatch
} from './config'

// ==========================================
// PROJECTS
// ==========================================

export async function getProjects() {
    try {
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

export async function deleteProject(projectId) {
    try {
        const rowsSnapshot = await getDocs(collection(db, 'projects', projectId, 'rows'))
        const batch = writeBatch(db)
        rowsSnapshot.docs.forEach(d => batch.delete(d.ref))
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

export async function addProjectPage(projectId, pageData) {
    try {
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

export async function deleteProjectPage(projectId, pageId) {
    try {
        const rowsSnapshot = await getDocs(collection(db, 'projects', projectId, 'pages', pageId, 'rows'))
        const batch = writeBatch(db)
        rowsSnapshot.docs.forEach(d => batch.delete(d.ref))
        batch.delete(doc(db, 'projects', projectId, 'pages', pageId))
        await batch.commit()
        console.log('✅ [Firestore] Page deleted:', pageId)
    } catch (error) {
        console.error('Error deleting page:', error)
        throw error
    }
}

// ==========================================
// PAGE ROWS
// ==========================================

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
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error adding rows:', error)
        throw error
    }
}

export async function updatePageRow(projectId, pageId, rowId, updates) {
    try {
        const docRef = doc(db, 'projects', projectId, 'pages', pageId, 'rows', rowId)
        await updateDoc(docRef, updates)
        console.log('✅ [Firestore] Row updated:', rowId)
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating row:', error)
        throw error
    }
}

// ==========================================
// LEGACY PROJECT ROWS (flat structure)
// ==========================================

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
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error adding rows:', error)
        throw error
    }
}

export async function updateProjectRow(projectId, rowId, updates) {
    try {
        const docRef = doc(db, 'projects', projectId, 'rows', rowId)
        await updateDoc(docRef, updates)
        console.log('✅ [Firestore] Row updated:', rowId)
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating row:', error)
        throw error
    }
}

export async function updateProjectRows(projectId, rowUpdates) {
    try {
        const batch = writeBatch(db)

        rowUpdates.forEach(({ id, changes }) => {
            const docRef = doc(db, 'projects', projectId, 'rows', id)
            batch.set(docRef, { ...changes, id }, { merge: true })
        })

        await batch.commit()
        console.log('✅ [Firestore] Updated', rowUpdates.length, 'rows')
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating rows:', error)
        throw error
    }
}

export async function deletePageRows(projectId, pageId, rowIds) {
    try {
        const batch = writeBatch(db)
        rowIds.forEach(rowId => {
            const docRef = doc(db, 'projects', projectId, 'pages', pageId, 'rows', rowId)
            batch.delete(docRef)
        })
        await batch.commit()
        console.log('✅ [Firestore] Deleted rows from page:', pageId)
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error deleting page rows:', error)
        throw error
    }
}

export async function deleteProjectRows(projectId, rowIds) {
    try {
        const batch = writeBatch(db)
        rowIds.forEach(rowId => {
            const docRef = doc(db, 'projects', projectId, 'rows', rowId)
            batch.delete(docRef)
        })
        await batch.commit()
        console.log('✅ [Firestore] Deleted rows from project:', projectId)
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error deleting project rows:', error)
        throw error
    }
}
