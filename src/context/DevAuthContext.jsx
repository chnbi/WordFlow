import { createContext, useContext } from 'react';
import { useAuth as useProductionAuth } from '../hooks/useAuth';

// ===========================================
// DEV MODE: Set via VITE_DEV_AUTH environment variable
// ===========================================
export const DEV_BYPASS_AUTH = import.meta.env.VITE_DEV_AUTH === 'true';

// Default dev user (only used if VITE_DEV_AUTH is true)
export const DEFAULT_DEV_USER = {
    id: 'dev-user',
    email: 'dev@example.com',
    name: 'Developer',
    avatar: null
};

// Auth context with role support (Dev mode only)
export const DevAuthContext = createContext(null);
export const useDevAuth = () => useContext(DevAuthContext);

// Export the correct hook based on mode
export const useAuth = DEV_BYPASS_AUTH ? useDevAuth : useProductionAuth;
