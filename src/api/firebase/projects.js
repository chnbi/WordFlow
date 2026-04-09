// services/firebase/projects.js
import { db } from '../../lib/firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch,
    collectionGroup,
    increment,
    onSnapshot
} from 'firebase/firestore';

const COLLECTION = 'projects';

// ==========================================
// PROJECTS
// ==========================================

export async function getProjects() {
    try {
        const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching projects:', error);
        return [];
    }
}

export function subscribeToProjects(callback) {
    const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(projects);
    }, (error) => {
        console.error('Error subscribing to projects:', error);
        callback([]);
    });
}

export async function getProject(projectId) {
    try {
        const docRef = doc(db, COLLECTION, projectId);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) return null;
        return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
        console.error('Error fetching project:', error);
        return null;
    }
}

export async function createProject(projectData) {
    try {
        const docRef = await addDoc(collection(db, COLLECTION), {
            ...projectData,
            ownerId: projectData.ownerId || null, // Capture owner
            createdBy: projectData.createdBy || null, // Who created it
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            version: 1,
            status: projectData.status || 'draft'
        });
        return {
            id: docRef.id,
            ...projectData,
            status: projectData.status || 'draft',
            version: 1,
            createdAt: new Date().toISOString(), // Optimistic return
            updatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error creating project:', error);
        throw error;
    }
}

export async function updateProject(projectId, updates) {
    try {
        const docRef = doc(db, COLLECTION, projectId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            version: increment(1)
        });
    } catch (error) {
        console.error('Error updating project:', error);
        throw error;
    }
}

export async function deleteProject(projectId) {
    try {
        const batch = writeBatch(db);
        let operationCount = 0;
        const batches = [batch];

        // Helper to add to batch and commit if full
        const addToBatch = async (ref) => {
            batches[batches.length - 1].delete(ref);
            operationCount++;

            if (operationCount >= 450) { // Safety margin
                batches.push(writeBatch(db));
                operationCount = 0;
            }
        };

        // 1. Get all pages
        const pagesRef = collection(db, COLLECTION, projectId, 'pages');
        const pagesSnapshot = await getDocs(pagesRef);

        // 2. For each page, get its rows and delete them
        for (const pageDoc of pagesSnapshot.docs) {
            const pageRowsRef = collection(db, COLLECTION, projectId, 'pages', pageDoc.id, 'rows');
            const pageRowsSnapshot = await getDocs(pageRowsRef);

            for (const rowDoc of pageRowsSnapshot.docs) {
                await addToBatch(rowDoc.ref);
            }

            // Delete the page itself
            await addToBatch(pageDoc.ref);
        }

        // 3. Get all legacy/flat rows (direct subcollection of project)
        const projectRowsRef = collection(db, COLLECTION, projectId, 'rows');
        const projectRowsSnapshot = await getDocs(projectRowsRef);

        for (const rowDoc of projectRowsSnapshot.docs) {
            await addToBatch(rowDoc.ref);
        }

        // Note: Audit logs are intentionally NOT deleted here.
        // firestore.rules enforces `allow delete: if false` on audit_logs,
        // so attempting to batch-delete them would crash the entire operation.
        // Orphaned audit logs for deleted projects remain in Firestore but
        // are harmless — they contain no PII beyond what was already logged,
        // and can be cleaned up later via an admin script if needed.

        // 5. Delete the project document itself
        await addToBatch(doc(db, COLLECTION, projectId));

        // Commit all batches
        for (const b of batches) {
            await b.commit();
        }
    } catch (error) {
        console.error('Error deleting project:', error);
        throw error;
    }
}

// ==========================================
// PROJECT PAGES
// ==========================================

export async function getProjectPages(projectId) {
    try {
        const q = query(
            collection(db, COLLECTION, projectId, 'pages'),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching project pages:', error);
        return [];
    }
}

export async function addProjectPage(projectId, pageData) {
    try {
        const pages = await getProjectPages(projectId);
        const order = pages.length;

        const docRef = await addDoc(collection(db, COLLECTION, projectId, 'pages'), {
            ...pageData,
            project: projectId,
            order,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...pageData, order };
    } catch (error) {
        console.error('Error creating page:', error);
        throw error;
    }
}

export async function deleteProjectPage(projectId, pageId) {
    try {
        // Delete page doc 
        // Note: Subcollections (rows) are NOT automatically deleted in Firestore client SDK.
        // We manually delete rows associated with this page.
        const rowsRef = collection(db, COLLECTION, projectId, 'pages', pageId, 'rows');
        const rowsSnapshot = await getDocs(rowsRef);

        const CHUNK_SIZE = 400;
        const rowDocs = rowsSnapshot.docs;

        for (let i = 0; i < rowDocs.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = rowDocs.slice(i, i + CHUNK_SIZE);
            chunk.forEach(rowDoc => {
                batch.delete(rowDoc.ref);
            });
            await batch.commit();
        }

        await deleteDoc(doc(db, COLLECTION, projectId, 'pages', pageId));
    } catch (error) {
        console.error('Error deleting page:', error);
        throw error;
    }
}

export async function renameProjectPage(projectId, pageId, newName) {
    try {
        const pageRef = doc(db, COLLECTION, projectId, 'pages', pageId);
        await updateDoc(pageRef, { name: newName });
        await updateProject(projectId, {}); // Touch lastUpdated
    } catch (error) {
        console.error('Error renaming page:', error);
        throw error;
    }
}

// ==========================================
// PAGE ROWS
// ==========================================

export async function getPageRows(projectId, pageId) {
    try {
        const q = query(
            collection(db, COLLECTION, projectId, 'pages', pageId, 'rows'),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching page rows:', error);
        return [];
    }
}

export async function addPageRows(projectId, pageId, rows) {
    try {
        const results = [];
        const CHUNK_SIZE = 400; // Safety margin below 500 limit

        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = rows.slice(i, i + CHUNK_SIZE);
            const chunkResults = [];

            chunk.forEach((row, index) => {
                const rowRef = pageId
                    ? doc(collection(db, COLLECTION, projectId, 'pages', pageId, 'rows'))
                    : doc(collection(db, COLLECTION, projectId, 'rows'));
                // Destructure out the client-side temp `id` to avoid it overwriting the Firestore-generated ID
                const { id: _tempId, ...rowWithoutId } = row;
                const rowData = {
                    ...rowWithoutId,
                    project: projectId,
                    pageId: pageId,
                    order: i + index, // Correct global order
                    status: row.status || 'draft',
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                batch.set(rowRef, rowData);
                chunkResults.push({ ...rowData, id: rowRef.id });
            });

            await batch.commit();
            results.push(...chunkResults);
        }

        await updateProject(projectId, {});
        return results;
    } catch (error) {
        console.error('Error adding rows:', error);
        throw error;
    }
}

export async function updatePageRow(projectId, pageId, rowId, updates) {
    try {
        const rowRef = doc(db, COLLECTION, projectId, 'pages', pageId, 'rows', rowId);
        await updateDoc(rowRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        await updateProject(projectId, {});
    } catch (error) {
        console.error('Error updating row:', error);
        throw error;
    }
}


// ==========================================
// LEGACY PROJECT ROWS (flat structure)
// ==========================================

export async function getProjectRows(projectId) {
    try {
        // Fetch ALL rows in the flat /projects/{id}/rows collection.
        // These are legacy rows that need migration to /projects/{id}/pages/{pageId}/rows.
        // Some may already have a pageId set from a partial migration but were never
        // physically moved to the nested subcollection.
        const q = query(
            collection(db, COLLECTION, projectId, 'rows'),
            orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching project rows:', error);
        return [];
    }
}

export async function addProjectRows(projectId, rows) {
    return addPageRows(projectId, '', rows);
}

/**
 * Update a single row. 
 * @param {string} projectId
 * @param {string} pageId - The page the row belongs to. Pass null/'' for legacy flat rows.
 * @param {string} rowId
 * @param {object} updates
 */
export async function updateProjectRow(projectId, pageId, rowId, updates) {
    const rowRef = pageId
        ? doc(db, COLLECTION, projectId, 'pages', pageId, 'rows', rowId)
        : doc(db, COLLECTION, projectId, 'rows', rowId);
    await updateDoc(rowRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
    await updateProject(projectId, {});
}

/**
 * Update multiple rows. Each entry must include { id, pageId, changes }.
 * pageId is required to route to the correct Firestore subcollection path.
 * Pass an empty string or null pageId for legacy flat-structure rows.
 */
export async function updateProjectRows(projectId, rowUpdates) {
    try {
        const CHUNK_SIZE = 400;

        for (let i = 0; i < rowUpdates.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = rowUpdates.slice(i, i + CHUNK_SIZE);

            chunk.forEach(({ id, pageId, changes }) => {
                // Route to the correct path based on whether the row has a pageId
                const rowRef = pageId
                    ? doc(db, COLLECTION, projectId, 'pages', pageId, 'rows', id)
                    : doc(db, COLLECTION, projectId, 'rows', id);
                batch.update(rowRef, {
                    ...changes,
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
        }

        await updateProject(projectId, {});
    } catch (error) {
        console.error('Error updating rows:', error);
        throw error;
    }
}

export async function deletePageRows(projectId, pageId, rowIds) {
    try {
        const CHUNK_SIZE = 400;

        for (let i = 0; i < rowIds.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = rowIds.slice(i, i + CHUNK_SIZE);

            chunk.forEach(id => {
                const rowRef = doc(db, COLLECTION, projectId, 'pages', pageId, 'rows', id);
                batch.delete(rowRef);
            });

            await batch.commit();
        }

        await updateProject(projectId, {});
    } catch (error) {
        console.error('Error deleting page rows:', error);
        throw error;
    }
}

export async function deleteProjectRows(projectId, rowIds) {
    try {
        const CHUNK_SIZE = 400;

        for (let i = 0; i < rowIds.length; i += CHUNK_SIZE) {
            const batch = writeBatch(db);
            const chunk = rowIds.slice(i, i + CHUNK_SIZE);

            chunk.forEach(id => {
                const rowRef = doc(db, COLLECTION, projectId, 'rows', id);
                batch.delete(rowRef);
            });

            await batch.commit();
        }

        await updateProject(projectId, {});
    } catch (error) {
        console.error('Error deleting project rows:', error);
        throw error;
    }
}

/**
 * Get all rows with specific statuses (for Submissions view)
 * Uses Collection Group Query on 'rows' collection
 */
export async function getUserSubmissions(userId) {
    try {
        const rowsQuery = query(
            collectionGroup(db, 'rows'),
            where('submittedBy.uid', '==', userId),
            where('status', 'in', ['review', 'approved', 'changes'])
        );

        const querySnapshot = await getDocs(rowsQuery);
        // Sort client-side to avoid needing a custom composite index in Firestore
        const submissions = [];

        // We need to fetch project and page details manually since Firestore 
        // doesn't support 'expand' like PocketBase
        // Optimisation: Cache project/page data to avoid redundant fetches
        const projectCache = {};
        const pageCache = {};

        for (const docSnap of querySnapshot.docs) {
            const rowData = { id: docSnap.id, ...docSnap.data() };
            // rowData.ref.parent.parent is the parent doc (Page or Project)
            // But getting parent data from ref requires a fetch

            // Construct parent paths
            const parentCollection = docSnap.ref.parent; // 'rows'
            const parentDoc = parentCollection.parent; // Page or Project doc ref

            if (parentDoc) {
                // If nested in Page: projects/{pid}/pages/{pageId}/rows/{rowId}
                // parentDoc is the Page. parentDoc.parent.parent is the Project.
                if (parentDoc.parent.id === 'pages') {
                    const pageId = parentDoc.id;
                    const projectId = parentDoc.parent.parent.id;

                    // Fetch Page Name
                    if (!pageCache[pageId]) {
                        const pageSnap = await getDoc(parentDoc);
                        pageCache[pageId] = pageSnap.exists() ? pageSnap.data() : { name: 'Unknown Page' };
                    }

                    // Fetch Project Name
                    if (!projectCache[projectId]) {
                        const projectSnap = await getDoc(parentDoc.parent.parent);
                        projectCache[projectId] = projectSnap.exists() ? projectSnap.data() : { name: 'Unknown Project' };
                    }

                    // Simulated 'expand' property
                    rowData.expand = {
                        project: projectCache[projectId],
                        page: pageCache[pageId]
                    };
                }
                // If direct in Project (Legacy): projects/{pid}/rows/{rowId}
                else if (parentDoc.parent.id === 'projects') {
                    const projectId = parentDoc.id;

                    if (!projectCache[projectId]) {
                        const projectSnap = await getDoc(parentDoc);
                        projectCache[projectId] = projectSnap.exists() ? projectSnap.data() : { name: 'Unknown Project' };
                    }

                    rowData.expand = {
                        project: projectCache[projectId],
                        page: null
                    };
                }
            }

            submissions.push(rowData);
        }

        // Sort descending by updatedAt
        submissions.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

        return submissions;
    } catch (error) {
        console.error("Error fetching submissions:", error);
        throw error;
    }
}


