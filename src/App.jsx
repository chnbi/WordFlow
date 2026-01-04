import { useState, useEffect } from 'react'
import Layout from './components/layout'
import Home from './pages/home'
import Dashboard from './pages/dashboard'
import Glossary from './pages/glossary-library'
import PromptLibrary from './pages/prompt-library'
import Settings from './pages/settings'
import ProjectView from './pages/project-details'
import ImageTranslation from './pages/image-translation'
import Login from './pages/login'
import { createContext, useContext } from 'react'
import { ROLES, canDo as checkPermission, getRoleLabel, getRoleColor, ACTIONS } from './lib/permissions'
import { ProjectProvider, useProjects } from './context/ProjectContext'
import { GlossaryProvider } from './context/GlossaryContext'
import { PromptProvider } from './context/PromptContext'

// ===========================================
// DEV MODE: Set to true to bypass auth
// ===========================================
const DEV_BYPASS_AUTH = true

// Mock user for development
const mockUser = {
    uid: 'dev-user-123',
    email: 'dev@example.com',
    displayName: 'Dev User',
    photoURL: null
}

// Auth context with role support
const DevAuthContext = createContext(null)
export const useAuth = () => useContext(DevAuthContext)

// Export permissions for use in components
export { ROLES, ACTIONS, getRoleLabel, getRoleColor }


// Simple client-side routing based on URL hash
function useRoute() {
    const [route, setRoute] = useState(window.location.hash || '#')

    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash || '#')
        window.addEventListener('hashchange', handleHashChange)
        return () => window.removeEventListener('hashchange', handleHashChange)
    }, [])

    return route
}

// Component that uses project context for breadcrumbs
function AppWithRouting({ authContextValue }) {
    const route = useRoute()
    const { getProject } = useProjects()

    // Get page component and breadcrumbs based on route
    const getPageConfig = () => {
        const path = route.replace('#', '') || '/'

        switch (path) {
            case '/':
            case '':
                return { component: Home, breadcrumbs: [{ label: 'Home' }] }
            case 'projects':
                return { component: Dashboard, breadcrumbs: [{ label: 'Home', href: '#' }, { label: 'Projects' }] }
            case 'glossary':
                return { component: Glossary, breadcrumbs: [{ label: 'Home', href: '#' }, { label: 'Glossary' }] }
            case 'prompt':
                return { component: PromptLibrary, breadcrumbs: [{ label: 'Home', href: '#' }, { label: 'Prompt Library' }] }
            case 'image-translate':
                return { component: ImageTranslation, breadcrumbs: [{ label: 'Home', href: '#' }, { label: 'Image Translation' }] }
            case 'settings':
                return { component: Settings, breadcrumbs: [{ label: 'Home', href: '#' }, { label: 'Settings' }] }
            default:
                if (path.startsWith('project/')) {
                    const projectId = path.split('/')[1]
                    const project = getProject(projectId)
                    const projectName = project?.name || `Project #${projectId}`
                    return {
                        component: ProjectView,
                        breadcrumbs: [
                            { label: 'Home', href: '#' },
                            { label: 'Projects', href: '#projects' },
                            { label: projectName }
                        ],
                        projectId
                    }
                }
                return { component: Home, breadcrumbs: [{ label: 'Home' }] }
        }
    }

    const { component: PageComponent, breadcrumbs, projectId } = getPageConfig()

    return (
        <DevAuthContext.Provider value={authContextValue}>
            <Layout breadcrumbs={breadcrumbs}>
                <PageComponent projectId={projectId} />
            </Layout>
        </DevAuthContext.Provider>
    )
}

function App() {
    // Role state for dev testing
    const [currentRole, setCurrentRole] = useState(ROLES.ADMIN)

    // Create context value with canDo helper
    const authContextValue = {
        user: mockUser,
        role: currentRole,
        setRole: setCurrentRole,
        loading: false,
        signIn: () => console.log('Sign in clicked'),
        signOut: () => console.log('Sign out clicked'),
        canDo: (action) => checkPermission(currentRole, action),
        isAdmin: currentRole === ROLES.ADMIN,
        isManager: currentRole === ROLES.MANAGER,
        isEditor: currentRole === ROLES.EDITOR,
        isViewer: currentRole === ROLES.VIEWER,
    }

    if (DEV_BYPASS_AUTH) {
        return (
            <ProjectProvider>
                <GlossaryProvider>
                    <PromptProvider>
                        <AppWithRouting authContextValue={authContextValue} />
                    </PromptProvider>
                </GlossaryProvider>
            </ProjectProvider>
        )
    }

    // Production mode - use real auth
    const { AuthProvider, useAuth: realUseAuth } = require('./hooks/useAuth.jsx')

    function AppContent() {
        const { user, loading } = realUseAuth()

        if (loading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            )
        }

        if (!user) return <Login />

        return (
            <Layout breadcrumbs={[{ label: 'Home' }]}>
                <Home />
            </Layout>
        )
    }

    return (
        <ProjectProvider>
            <GlossaryProvider>
                <PromptProvider>
                    <AuthProvider>
                        <AppContent />
                    </AuthProvider>
                </PromptProvider>
            </GlossaryProvider>
        </ProjectProvider>
    )
}

export default App
