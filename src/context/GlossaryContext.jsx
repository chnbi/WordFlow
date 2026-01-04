// GlossaryContext - Centralized state management for glossary terms
// Now with Firestore persistence
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { glossaryTerms as mockGlossaryTerms } from '@/data/mockData'
import * as firestoreService from '@/lib/firestore-service'

// Feature flag - set to true to use Firestore
const USE_FIRESTORE = true

const GlossaryContext = createContext(null)

export function GlossaryProvider({ children }) {
    const [terms, setTerms] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [dataSource, setDataSource] = useState('loading')

    // Load glossary terms from Firestore on mount
    useEffect(() => {
        async function loadData() {
            if (!USE_FIRESTORE) {
                setTerms(mockGlossaryTerms)
                setDataSource('mock')
                setIsLoading(false)
                return
            }

            try {
                console.log('🔄 [Firestore] Loading glossary terms...')
                let firestoreTerms = await firestoreService.getGlossaryTerms()

                if (firestoreTerms.length === 0) {
                    // Seed default glossary
                    await firestoreService.seedDefaultGlossary()
                    firestoreTerms = await firestoreService.getGlossaryTerms()
                }

                setTerms(firestoreTerms)
                setDataSource('firestore')
                console.log('✅ [Firestore] Loaded', firestoreTerms.length, 'glossary terms')
            } catch (error) {
                console.error('❌ [Firestore] Error loading glossary:', error)
                setTerms(mockGlossaryTerms)
                setDataSource('mock')
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [])

    // Add a new term (with Firestore sync)
    const addTerm = useCallback(async (term) => {
        const termData = {
            ...term,
            dateModified: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }

        if (dataSource === 'firestore') {
            try {
                const created = await firestoreService.createGlossaryTerm(termData)
                setTerms(prev => [created, ...prev])
                return created
            } catch (error) {
                console.error('Error creating glossary term:', error)
                throw error
            }
        } else {
            const newTerm = { ...termData, id: String(Date.now()) }
            setTerms(prev => [newTerm, ...prev])
            return newTerm
        }
    }, [dataSource])

    // Update a term (with Firestore sync)
    const updateTerm = useCallback(async (id, updates) => {
        setTerms(prev => prev.map(t =>
            t.id === id ? {
                ...t,
                ...updates,
                dateModified: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            } : t
        ))

        if (dataSource === 'firestore') {
            firestoreService.updateGlossaryTerm(id, updates).catch(console.error)
        }
    }, [dataSource])

    // Delete a term (with Firestore sync)
    const deleteTerm = useCallback(async (id) => {
        setTerms(prev => prev.filter(t => t.id !== id))

        if (dataSource === 'firestore') {
            firestoreService.deleteGlossaryTerm(id).catch(console.error)
        }
    }, [dataSource])

    // Bulk delete (with Firestore sync)
    const deleteTerms = useCallback(async (ids) => {
        setTerms(prev => prev.filter(t => !ids.includes(t.id)))

        if (dataSource === 'firestore') {
            firestoreService.deleteGlossaryTerms(ids).catch(console.error)
        }
    }, [dataSource])

    // Get term by ID
    const getTerm = useCallback((id) => {
        return terms.find(t => t.id === id)
    }, [terms])

    // Get unique categories
    const categories = [...new Set(terms.map(t => t.category).filter(Boolean))]

    const value = {
        terms,
        isLoading,
        dataSource,
        addTerm,
        updateTerm,
        deleteTerm,
        deleteTerms,
        getTerm,
        categories,
    }

    return (
        <GlossaryContext.Provider value={value}>
            {children}
        </GlossaryContext.Provider>
    )
}

export function useGlossary() {
    const context = useContext(GlossaryContext)
    if (!context) {
        throw new Error('useGlossary must be used within a GlossaryProvider')
    }
    return context
}
