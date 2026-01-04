// ProjectContext - Centralized state management for projects
// Includes row selection, translation queue, and template-based translation
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { projects as mockProjects, projectRows as mockProjectRows } from '@/data/mockData'
import * as firestoreService from '@/lib/firestore-service'

const ProjectContext = createContext(null)

// Translation queue configuration
const BATCH_SIZE = 10  // Max rows per API call
const THROTTLE_MS = 1000  // 1 second between batches

// Feature flag - set to true to use Firestore, false for mock data
const USE_FIRESTORE = true

export function ProjectProvider({ children }) {
    const [projects, setProjects] = useState([])
    const [projectRows, setProjectRows] = useState({})  // Legacy flat rows: { projectId: rows[] }
    const [projectPages, setProjectPages] = useState({}) // Pages: { projectId: { pages: [], pageRows: { pageId: rows[] } } }
    const [selectedProjectId, setSelectedProjectId] = useState(null)
    const [selectedPageId, setSelectedPageId] = useState({}) // { projectId: pageId }
    const [isLoading, setIsLoading] = useState(true)
    const [dataSource, setDataSource] = useState('loading') // 'firestore', 'mock', 'loading'

    // Row selection state (per project)
    const [selectedRows, setSelectedRows] = useState({}) // { projectId: Set<rowId> }

    // Translation queue state
    const [translationQueue, setTranslationQueue] = useState([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [queueProgress, setQueueProgress] = useState({ current: 0, total: 0 })
    const processingRef = useRef(false)

    // ==========================================
    // DATA LOADING (Firestore with mock fallback)
    // ==========================================

    useEffect(() => {
        async function loadData() {
            if (!USE_FIRESTORE) {
                // Use mock data directly
                setProjects(mockProjects)
                setProjectRows(mockProjectRows)
                setDataSource('mock')
                setIsLoading(false)
                console.log('📦 [Data] Using mock data')
                return
            }

            try {
                console.log('🔄 [Firestore] Loading projects...')
                const firestoreProjects = await firestoreService.getProjects()

                if (firestoreProjects.length === 0) {
                    // Firestore is empty - use mock data
                    console.log('📦 [Firestore] Empty, using mock data')
                    setProjects(mockProjects)
                    setProjectRows(mockProjectRows)
                    setDataSource('mock')
                } else {
                    // Load projects, their legacy rows, and pages
                    const allRows = {}
                    const allPagesData = {}

                    for (const project of firestoreProjects) {
                        // Load legacy flat rows
                        const rows = await firestoreService.getProjectRows(project.id)
                        allRows[project.id] = rows

                        // Load pages and their rows
                        const pages = await firestoreService.getProjectPages(project.id)
                        const pageRows = {}
                        for (const page of pages) {
                            const pRows = await firestoreService.getPageRows(project.id, page.id)
                            pageRows[page.id] = pRows
                        }
                        allPagesData[project.id] = { pages, pageRows }

                        // Set default selected page
                        if (pages.length > 0) {
                            setSelectedPageId(prev => ({ ...prev, [project.id]: pages[0].id }))
                        }
                    }

                    setProjects(firestoreProjects)
                    setProjectRows(allRows)
                    setProjectPages(allPagesData)
                    setDataSource('firestore')
                    console.log('✅ [Firestore] Loaded', firestoreProjects.length, 'projects')
                }
            } catch (error) {
                console.error('❌ [Firestore] Error loading data:', error)
                // Fallback to mock data
                setProjects(mockProjects)
                setProjectRows(mockProjectRows)
                setDataSource('mock')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    // Get a project by ID
    const getProject = useCallback((id) => {
        return projects.find(p => p.id === id)
    }, [projects])

    // Get project rows by project ID (legacy flat structure)
    const getProjectRows = useCallback((projectId) => {
        return projectRows[projectId] || []
    }, [projectRows])

    // Get pages for a project
    const getProjectPages = useCallback((projectId) => {
        return projectPages[projectId]?.pages || []
    }, [projectPages])

    // Get rows for a specific page
    const getPageRows = useCallback((projectId, pageId) => {
        return projectPages[projectId]?.pageRows?.[pageId] || []
    }, [projectPages])

    // Get currently selected page for a project
    const getSelectedPageId = useCallback((projectId) => {
        return selectedPageId[projectId] || null
    }, [selectedPageId])

    // Set selected page
    const selectPage = useCallback((projectId, pageId) => {
        setSelectedPageId(prev => ({ ...prev, [projectId]: pageId }))
    }, [])

    // Update a single row (with Firestore sync)
    const updateProjectRow = useCallback((projectId, rowId, updates) => {
        // Update local state optimistically
        setProjectRows(prev => ({
            ...prev,
            [projectId]: (prev[projectId] || []).map(row =>
                row.id === rowId ? { ...row, ...updates } : row
            )
        }))

        // Sync to Firestore if using it
        if (dataSource === 'firestore') {
            firestoreService.updateProjectRow(projectId, rowId, updates).catch(console.error)
        }
    }, [dataSource])

    // Update multiple rows at once (with Firestore sync)
    const updateProjectRows = useCallback((projectId, rowUpdates) => {
        // Update local state optimistically
        setProjectRows(prev => ({
            ...prev,
            [projectId]: (prev[projectId] || []).map(row => {
                const update = rowUpdates.find(u => u.id === row.id)
                return update ? { ...row, ...update.changes } : row
            })
        }))

        // Sync to Firestore if using it
        if (dataSource === 'firestore') {
            firestoreService.updateProjectRows(projectId, rowUpdates).catch(console.error)
        }
    }, [dataSource])

    // Add rows to a project (for Excel import, with Firestore sync)
    const addProjectRows = useCallback(async (projectId, newRows) => {
        // Generate IDs for new rows if not present
        const rowsWithIds = newRows.map((row, idx) => ({
            ...row,
            id: row.id || `row_${Date.now()}_${idx}`,
            status: row.status || 'pending'
        }))

        // Update local state optimistically
        setProjectRows(prev => ({
            ...prev,
            [projectId]: [...(prev[projectId] || []), ...rowsWithIds]
        }))

        // Sync to Firestore if using it
        if (dataSource === 'firestore') {
            try {
                await firestoreService.addProjectRows(projectId, rowsWithIds)
            } catch (error) {
                console.error('Error adding rows to Firestore:', error)
            }
        }

        return rowsWithIds
    }, [dataSource])

    // ==========================================
    // ROW SELECTION LOGIC
    // ==========================================

    // Get selected row IDs for a project
    const getSelectedRowIds = useCallback((projectId) => {
        return selectedRows[projectId] || new Set()
    }, [selectedRows])

    // Toggle row selection
    const toggleRowSelection = useCallback((projectId, rowId) => {
        setSelectedRows(prev => {
            const current = new Set(prev[projectId] || [])
            if (current.has(rowId)) {
                current.delete(rowId)
            } else {
                current.add(rowId)
            }
            return { ...prev, [projectId]: current }
        })
    }, [])

    // Select all rows in a project
    const selectAllRows = useCallback((projectId) => {
        const rows = projectRows[projectId] || []
        const allIds = new Set(rows.map(r => r.id))
        setSelectedRows(prev => ({ ...prev, [projectId]: allIds }))
    }, [projectRows])

    // Deselect all rows in a project
    const deselectAllRows = useCallback((projectId) => {
        setSelectedRows(prev => ({ ...prev, [projectId]: new Set() }))
    }, [])

    // Select rows by filter (e.g., only pending)
    const selectRowsByStatus = useCallback((projectId, status) => {
        const rows = projectRows[projectId] || []
        const filteredIds = new Set(rows.filter(r => r.status === status).map(r => r.id))
        setSelectedRows(prev => ({ ...prev, [projectId]: filteredIds }))
    }, [projectRows])

    // ==========================================
    // TRANSLATION QUEUE LOGIC
    // ==========================================

    // Check if Gemini API is configured
    const isApiConfigured = () => {
        return !!import.meta.env.GEMINI_API_KEY
    }

    // Perform translation using Gemini API or mock fallback
    const performTranslation = async (rows, template, retryCount = 0) => {
        const MAX_RETRIES = 3
        const BASE_BACKOFF_MS = 5000

        // Check if API key is available
        if (!isApiConfigured()) {
            console.log('[Translation] No API key configured, using mock mode')
            return mockTranslation(rows, template)
        }

        try {
            // Dynamic import to avoid build errors when API key is not set
            const { translateBatch } = await import('@/lib/gemini-service')
            const results = await translateBatch(rows, template)

            // Add template info to results
            return results.map(r => ({
                ...r,
                templateUsed: template?.name || 'Default',
            }))

        } catch (error) {
            console.error('[Translation] API error:', error)

            // Handle rate limit with exponential backoff
            if (error.message === 'RATE_LIMIT' && retryCount < MAX_RETRIES) {
                const backoffMs = BASE_BACKOFF_MS * Math.pow(2, retryCount)
                console.log(`[Translation] Rate limited, retrying in ${backoffMs}ms...`)
                await new Promise(resolve => setTimeout(resolve, backoffMs))
                return performTranslation(rows, template, retryCount + 1)
            }

            // If API fails, fall back to mock for development
            console.warn('[Translation] Falling back to mock mode due to error')
            return mockTranslation(rows, template)
        }
    }

    // Mock translation for development/fallback
    const mockTranslation = async (rows, template) => {
        // Short delay to simulate API (was 800ms)
        await new Promise(resolve => setTimeout(resolve, 200))

        const templateLabel = template?.name || 'Default'
        return rows.map(row => ({
            id: row.id,
            my: row.my || `[${templateLabel}] ${row.en || row.source}`,
            zh: row.zh || `[${templateLabel}] ${row.en || row.source}`,
            status: 'review',
            templateUsed: templateLabel,
            translatedAt: new Date().toISOString(),
        }))
    }

    // Add rows to translation queue
    const queueTranslation = useCallback((projectId, rowIds, template) => {
        const rows = (projectRows[projectId] || []).filter(r => rowIds.has(r.id))

        if (rows.length === 0) return

        // Mark rows as "queued"
        const queuedUpdates = rows.map(r => ({ id: r.id, changes: { status: 'queued' } }))
        updateProjectRows(projectId, queuedUpdates)

        // Create batches
        const batches = []
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            batches.push({
                projectId,
                rows: rows.slice(i, i + BATCH_SIZE),
                template,
            })
        }

        setTranslationQueue(prev => [...prev, ...batches])
        // Reset progress for new job (not accumulate)
        setQueueProgress({ current: 0, total: batches.length })
    }, [projectRows, updateProjectRows])

    // Process translation queue
    // Cancellation ref
    const isCancelledRef = useRef(false)

    // Cancel the translation queue
    const cancelTranslationQueue = useCallback(() => {
        console.log('🛑 [Translation] Cancellation requested')
        isCancelledRef.current = true

        // Mark all queued rows back to pending
        translationQueue.forEach(batch => {
            const pendingUpdates = batch.rows.map(r => ({
                id: r.id,
                changes: { status: 'pending' }
            }))
            updateProjectRows(batch.projectId, pendingUpdates)
        })

        // Clear the queue
        setTranslationQueue([])
        setQueueProgress({ current: 0, total: 0 })
        setIsProcessing(false)
        processingRef.current = false
    }, [translationQueue, updateProjectRows])

    // Process translation queue
    useEffect(() => {
        if (translationQueue.length === 0 || processingRef.current) return

        const processNext = async () => {
            processingRef.current = true
            isCancelledRef.current = false
            setIsProcessing(true)

            while (translationQueue.length > 0 && !isCancelledRef.current) {
                const batch = translationQueue[0]

                // Mark batch rows as "translating"
                const translatingUpdates = batch.rows.map(r => ({ id: r.id, changes: { status: 'translating' } }))
                updateProjectRows(batch.projectId, translatingUpdates)

                try {
                    // Perform translation (uses real API if configured, else mock)
                    const results = await performTranslation(batch.rows, batch.template)

                    // Check if cancelled during API call
                    if (isCancelledRef.current) {
                        console.log('🛑 [Translation] Cancelled during batch, stopping')
                        break
                    }

                    // Update rows with results
                    const resultUpdates = results.map(r => ({ id: r.id, changes: r }))
                    updateProjectRows(batch.projectId, resultUpdates)

                } catch (error) {
                    console.error('Translation error:', error)
                    // Mark as error
                    const errorUpdates = batch.rows.map(r => ({ id: r.id, changes: { status: 'error' } }))
                    updateProjectRows(batch.projectId, errorUpdates)
                }

                // Remove processed batch
                setTranslationQueue(prev => prev.slice(1))
                setQueueProgress(prev => ({ ...prev, current: prev.current + 1 }))

                // Throttle (but check for cancellation during wait)
                if (translationQueue.length > 1 && !isCancelledRef.current) {
                    await new Promise(resolve => setTimeout(resolve, THROTTLE_MS))
                }
            }

            processingRef.current = false
            setIsProcessing(false)
            if (!isCancelledRef.current) {
                setQueueProgress({ current: 0, total: 0 })
            }
        }

        processNext()
    }, [translationQueue, updateProjectRows])

    // Clear selection after queuing
    const translateSelectedRows = useCallback((projectId, template) => {
        const selected = selectedRows[projectId]
        if (!selected || selected.size === 0) return

        queueTranslation(projectId, selected, template)
        deselectAllRows(projectId)
    }, [selectedRows, queueTranslation, deselectAllRows])

    // ==========================================
    // PROJECT CRUD
    // ==========================================

    // Add a new project (with Firestore sync)
    const addProject = useCallback(async (project) => {
        const projectData = {
            ...project,
            status: 'draft',
            progress: 0,
            translatedRows: 0,
            pendingReview: 0,
            lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }

        if (dataSource === 'firestore') {
            try {
                const created = await firestoreService.createProject(projectData)
                const newProject = { ...projectData, id: created.id }
                setProjects(prev => [newProject, ...prev])
                setProjectRows(prev => ({ ...prev, [created.id]: [] }))
                return newProject
            } catch (error) {
                console.error('Error creating project in Firestore:', error)
                throw error
            }
        } else {
            // Mock mode - generate local ID
            const newProject = { ...projectData, id: String(Date.now()) }
            setProjects(prev => [newProject, ...prev])
            setProjectRows(prev => ({ ...prev, [newProject.id]: [] }))
            return newProject
        }
    }, [dataSource])

    // Update a project (with Firestore sync)
    const updateProject = useCallback((id, updates) => {
        setProjects(prev => prev.map(p =>
            p.id === id ? { ...p, ...updates } : p
        ))

        // Sync to Firestore if using it
        if (dataSource === 'firestore') {
            firestoreService.updateProject(id, updates).catch(console.error)
        }
    }, [dataSource])

    // Delete a project (with Firestore sync)
    const deleteProject = useCallback((id) => {
        setProjects(prev => prev.filter(p => p.id !== id))
        setProjectRows(prev => {
            const { [id]: removed, ...rest } = prev
            return rest
        })

        // Sync to Firestore if using it
        if (dataSource === 'firestore') {
            firestoreService.deleteProject(id).catch(console.error)
        }
    }, [dataSource])

    // Get computed stats
    const stats = {
        totalProjects: projects.length,
        inProgress: projects.filter(p => p.status === 'in-progress').length,
        completed: projects.filter(p => p.status === 'completed').length,
        draft: projects.filter(p => p.status === 'draft').length,
    }

    const value = {
        // Loading state
        isLoading,
        dataSource,

        // Projects
        projects,
        selectedProjectId,
        setSelectedProjectId,
        getProject,
        addProject,
        updateProject,
        deleteProject,
        stats,

        // Legacy flat rows (backward compatibility)
        getProjectRows,
        updateProjectRow,
        updateProjectRows,
        addProjectRows,

        // Pages (multi-sheet support)
        getProjectPages,
        getPageRows,
        getSelectedPageId,
        selectPage,
        addProjectPage: async (projectId, pageData, rows = []) => {
            if (dataSource === 'firestore') {
                const page = await firestoreService.addProjectPage(projectId, pageData)
                if (rows.length > 0) {
                    await firestoreService.addPageRows(projectId, page.id, rows)
                }
                // Update local state
                setProjectPages(prev => ({
                    ...prev,
                    [projectId]: {
                        pages: [...(prev[projectId]?.pages || []), page],
                        pageRows: {
                            ...(prev[projectId]?.pageRows || {}),
                            [page.id]: rows
                        }
                    }
                }))
                // Select the new page
                setSelectedPageId(prev => ({ ...prev, [projectId]: page.id }))
                return page
            }
        },

        // Selection
        getSelectedRowIds,
        toggleRowSelection,
        selectAllRows,
        deselectAllRows,
        selectRowsByStatus,

        // Translation Queue
        translateSelectedRows,
        queueTranslation,
        cancelTranslationQueue,
        isProcessing,
        queueProgress,
        translationQueue,
    }

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    )
}

export function useProjects() {
    const context = useContext(ProjectContext)
    if (!context) {
        throw new Error('useProjects must be used within a ProjectProvider')
    }
    return context
}
