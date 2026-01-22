// Authentication Hook - PocketBase Integration
import { useState, useEffect, useContext, createContext, useCallback } from 'react'
import pb from '../api/pocketbase/client'
import { getUserByEmail, upsertUser } from '../api/pocketbase'
import { ROLES, canDo as checkPermission, getRoleLabel, getRoleColor } from '../lib/permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [userRole, setUserRole] = useState(ROLES.EDITOR)
    const [loading, setLoading] = useState(true)

    // Load user data and role from PocketBase
    const loadUserRole = useCallback(async (authUser) => {
        if (!authUser?.email) {
            setUserRole(ROLES.EDITOR)
            return
        }

        try {
            // Try to find user in our users collection
            const userData = await getUserByEmail(authUser.email)

            if (userData) {
                setUserRole(userData.role || ROLES.EDITOR)
                console.log('✅ [PocketBase] User role loaded:', userData.role)
            } else {
                // First-time user - create with default 'editor' role
                await upsertUser({
                    email: authUser.email,
                    name: authUser.name || authUser.username || 'User',
                    avatar: authUser.avatar || null,
                    role: ROLES.EDITOR
                })
                setUserRole(ROLES.EDITOR)
                console.log('✅ [PocketBase] New user created with editor role')
            }
        } catch (error) {
            console.error('Error loading user role:', error)
            setUserRole(ROLES.EDITOR)
        }
    }, [])

    useEffect(() => {
        // Check if there's already an authenticated user
        const checkAuth = async () => {
            try {
                if (pb.authStore.isValid && pb.authStore.model) {
                    const authUser = pb.authStore.model
                    setUser({
                        id: authUser.id,
                        email: authUser.email,
                        name: authUser.name || authUser.username,
                        avatar: authUser.avatar
                    })
                    await loadUserRole(authUser)
                } else {
                    setUser(null)
                    setUserRole(ROLES.EDITOR)
                }
            } catch (error) {
                console.error('Auth check error:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkAuth()

        // Listen for auth changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            if (model) {
                setUser({
                    id: model.id,
                    email: model.email,
                    name: model.name || model.username,
                    avatar: model.avatar
                })
                loadUserRole(model)
            } else {
                setUser(null)
                setUserRole(ROLES.EDITOR)
            }
        })

        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe()
            }
        }
    }, [loadUserRole])

    const signIn = async (email, password) => {
        try {
            const authData = await pb.collection('users').authWithPassword(email, password)
            console.log('✅ [PocketBase] User signed in:', authData.record.email)
            return authData
        } catch (error) {
            console.error('Sign in error:', error)
            throw error
        }
    }

    const signInWithOAuth = async (provider = 'google') => {
        try {
            const authData = await pb.collection('users').authWithOAuth2({ provider })
            console.log('✅ [PocketBase] OAuth sign in:', authData.record.email)
            return authData
        } catch (error) {
            console.error('OAuth sign in error:', error)
            throw error
        }
    }

    const signOut = async () => {
        try {
            pb.authStore.clear()
            setUser(null)
            setUserRole(ROLES.EDITOR)
            console.log('✅ [PocketBase] User signed out')
        } catch (error) {
            console.error('Sign out error:', error)
            throw error
        }
    }

    // Helper to check if user can perform an action
    const canDo = useCallback((action) => {
        return checkPermission(userRole, action)
    }, [userRole])

    const value = {
        user,
        role: userRole,
        loading,
        signIn,
        signInWithOAuth,
        signOut,
        canDo,
        isManager: userRole === ROLES.MANAGER,
        isEditor: userRole === ROLES.EDITOR,
        // Expose permission utilities
        getRoleLabel,
        getRoleColor,
        ROLES,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export { ROLES }
