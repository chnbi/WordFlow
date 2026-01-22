// services/pocketbase/index.js - Barrel export for all PocketBase services
// This provides a single import point with full backward compatibility

// Project operations
export {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectPages,
    addProjectPage,
    deleteProjectPage,
    renameProjectPage,
    getPageRows,
    addPageRows,
    updatePageRow,
    getProjectRows,
    addProjectRows,
    updateProjectRow,
    updateProjectRows,
    deletePageRows,
    deleteProjectRows
} from './projects'

// Template operations
export {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getOrCreateDefaultTemplate,
    DEFAULT_TEMPLATE
} from './templates'

// Glossary operations
export {
    getGlossaryTerms,
    getApprovedGlossaryTerms,
    createGlossaryTerm,
    createGlossaryTerms,
    updateGlossaryTerm,
    deleteGlossaryTerm,
    deleteGlossaryTerms,
    seedDefaultGlossary,
    getGlossaryCategories,
    createGlossaryCategory,
    deleteGlossaryCategory
} from './glossary'

// Audit Trail operations
export {
    logAction,
    getEntityHistory,
    getProjectActivity,
    getAllAuditLogs,
    formatAction,
    formatRelativeTime,
    AUDIT_ACTIONS
} from './audit'

// Role & User Management
export {
    getUsers,
    getUser,
    getUserByEmail,
    upsertUser,
    updateUserRole,
    deleteUser,
    getRoles
} from './roles'

// Export PocketBase client for direct access if needed
export { default as pb } from './client'
