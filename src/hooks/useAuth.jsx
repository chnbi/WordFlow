// Authentication Hook - Firebase Integration
import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUser } from '../api/firebase/roles'; // For fetching user role from Firestore
import { ROLES, canDo as checkPermission, getRoleLabel, getRoleColor } from '../lib/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(ROLES.EDITOR);
    const [loading, setLoading] = useState(true);

    // Load user role from Firestore
    const loadUserRole = useCallback(async (uid) => {
        if (!uid) {
            setUserRole(ROLES.EDITOR);
            return;
        }

        try {
            const userDoc = await getUser(uid);
            const role = userDoc?.role || ROLES.EDITOR;
            setUserRole(role);
            console.log('[Firebase] User role loaded:', role);
        } catch (error) {
            console.error('[Firebase] Error loading user role:', error);
            setUserRole(ROLES.EDITOR);
        }
    }, []);

    useEffect(() => {
        // Listen for auth changes
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            if (authUser) {
                setUser({
                    id: authUser.uid,
                    email: authUser.email,
                    name: authUser.displayName || authUser.email.split('@')[0],
                    avatar: authUser.photoURL
                });
                await loadUserRole(authUser.uid);
            } else {
                setUser(null);
                setUserRole(ROLES.EDITOR);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [loadUserRole]);

    const signIn = async (email, password) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('[Firebase] User signed in:', userCredential.user.email);
            return userCredential.user;
        } catch (error) {
            console.error('Sign in error:', error);
            // Throw existing error for UI handling
            throw error;
        }
    };

    // OAuth not yet configured in Firebase console, but placeholder:
    const signInWithOAuth = async (provider = 'google') => {
        console.warn('OAuth not yet implemented in Firebase adapter');
        // Implementation would use signInWithPopup(auth, new GoogleAuthProvider())
        throw new Error('OAuth not supported yet');
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserRole(ROLES.EDITOR);
            console.log('[Firebase] User signed out');
            // Reload not strictly necessary with Firebase listener, but good for clearing state
            window.location.reload();
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    // Helper to check if user can perform an action
    const canDo = useCallback((action) => {
        return checkPermission(userRole, action);
    }, [userRole]);

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
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export { ROLES };
