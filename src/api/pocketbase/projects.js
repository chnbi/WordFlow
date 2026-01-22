// services/pocketbase/projects.js - Project and Page CRUD operations for PocketBase
import pb from './client'

// ==========================================
// PROJECTS
// ==========================================

export async function getProjects() {
    try {
        const records = await pb.collection('projects').getFullList({
            sort: '-created'
        })
        return records
    } catch (error) {
        console.error('Error fetching projects:', error)
        return []
    }
}

export async function getProject(projectId) {
    try {
        return await pb.collection('projects').getOne(projectId)
    } catch (error) {
        console.error('Error fetching project:', error)
        return null
    }
}

export async function createProject(projectData) {
    try {
        const record = await pb.collection('projects').create({
            ...projectData,
            status: projectData.status || 'draft'
        })
        console.log('✅ [PocketBase] Project created:', record.id)
        return record
    } catch (error) {
        console.error('Error creating project:', error)
        throw error
    }
}

export async function updateProject(projectId, updates) {
    try {
        await pb.collection('projects').update(projectId, updates)
        console.log('✅ [PocketBase] Project updated:', projectId)
    } catch (error) {
        console.error('Error updating project:', error)
        throw error
    }
}

export async function deleteProject(projectId) {
    try {
        // Delete related pages first (rows will cascade from pages)
        const pages = await getProjectPages(projectId)
        for (const page of pages) {
            await deleteProjectPage(projectId, page.id)
        }
        // Delete legacy rows
        const rows = await getProjectRows(projectId)
        for (const row of rows) {
            await pb.collection('project_rows').delete(row.id)
        }
        // Delete project
        await pb.collection('projects').delete(projectId)
        console.log('✅ [PocketBase] Project deleted:', projectId)
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
        const records = await pb.collection('project_pages').getFullList({
            filter: `project = "${projectId}"`,
            sort: 'order'
        })
        return records
    } catch (error) {
        console.error('Error fetching project pages:', error)
        return []
    }
}

export async function addProjectPage(projectId, pageData) {
    try {
        const pages = await getProjectPages(projectId)
        const order = pages.length

        const record = await pb.collection('project_pages').create({
            ...pageData,
            project: projectId,
            order
        })
        console.log('✅ [PocketBase] Page created:', record.id)
        return record
    } catch (error) {
        console.error('Error creating page:', error)
        throw error
    }
}

export async function deleteProjectPage(projectId, pageId) {
    try {
        // Delete all rows in the page first
        const rows = await getPageRows(projectId, pageId)
        for (const row of rows) {
            await pb.collection('project_rows').delete(row.id)
        }
        // Delete page
        await pb.collection('project_pages').delete(pageId)
        console.log('✅ [PocketBase] Page deleted:', pageId)
    } catch (error) {
        console.error('Error deleting page:', error)
        throw error
    }
}

export async function renameProjectPage(projectId, pageId, newName) {
    try {
        await pb.collection('project_pages').update(pageId, { name: newName })
        console.log('✅ [PocketBase] Page renamed:', pageId, 'to', newName)
        await updateProject(projectId, {}) // Touch lastUpdated
    } catch (error) {
        console.error('Error renaming page:', error)
        throw error
    }
}

// ==========================================
// PAGE ROWS
// ==========================================

export async function getPageRows(projectId, pageId) {
    try {
        const records = await pb.collection('project_rows').getFullList({
            filter: `page = "${pageId}"`,
            sort: 'order'
        })
        return records
    } catch (error) {
        console.error('Error fetching page rows:', error)
        return []
    }
}

export async function addPageRows(projectId, pageId, rows) {
    try {
        // Create rows in parallel for better performance
        const promises = rows.map((row, i) =>
            pb.collection('project_rows').create({
                ...row,
                project: projectId,
                page: pageId,
                order: i,
                status: row.status || 'draft'
            })
        )
        const results = await Promise.all(promises)
        console.log('✅ [PocketBase] Added', rows.length, 'rows to page:', pageId)
        await updateProject(projectId, {})
        return results
    } catch (error) {
        console.error('Error adding rows:', error)
        throw error
    }
}

export async function updatePageRow(projectId, pageId, rowId, updates) {
    try {
        await pb.collection('project_rows').update(rowId, updates)
        console.log('✅ [PocketBase] Row updated:', rowId)
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
        const records = await pb.collection('project_rows').getFullList({
            filter: `project = "${projectId}" && page = ""`,
            sort: 'order'
        })
        return records
    } catch (error) {
        console.error('Error fetching project rows:', error)
        return []
    }
}

export async function addProjectRows(projectId, rows) {
    try {
        // Create rows in parallel for better performance
        const promises = rows.map((row, i) =>
            pb.collection('project_rows').create({
                ...row,
                project: projectId,
                page: '', // Legacy flat structure
                order: i,
                status: row.status || 'draft'
            })
        )
        const results = await Promise.all(promises)
        console.log('✅ [PocketBase] Added', rows.length, 'rows to project:', projectId)
        await updateProject(projectId, {})
        return results
    } catch (error) {
        console.error('Error adding rows:', error)
        throw error
    }
}

export async function updateProjectRow(projectId, rowId, updates) {
    try {
        await pb.collection('project_rows').update(rowId, updates)
        console.log('✅ [PocketBase] Row updated:', rowId)
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating row:', error)
        throw error
    }
}

export async function updateProjectRows(projectId, rowUpdates) {
    try {
        for (const { id, changes } of rowUpdates) {
            await pb.collection('project_rows').update(id, changes)
        }
        console.log('✅ [PocketBase] Updated', rowUpdates.length, 'rows')
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error updating rows:', error)
        throw error
    }
}

export async function deletePageRows(projectId, pageId, rowIds) {
    try {
        for (const rowId of rowIds) {
            await pb.collection('project_rows').delete(rowId)
        }
        console.log('✅ [PocketBase] Deleted rows from page:', pageId)
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error deleting page rows:', error)
        throw error
    }
}

export async function deleteProjectRows(projectId, rowIds) {
    try {
        for (const rowId of rowIds) {
            await pb.collection('project_rows').delete(rowId)
        }
        console.log('✅ [PocketBase] Deleted rows from project:', projectId)
        await updateProject(projectId, {})
    } catch (error) {
        console.error('Error deleting project rows:', error)
        throw error
    }
}
