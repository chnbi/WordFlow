// services/pocketbase/roles.js - User Role Management
import pb from './client'

/**
 * Get all users with their roles
 */
export async function getUsers() {
    try {
        const records = await pb.collection('users').getFullList({
            sort: 'created',
        })
        console.log('✅ [PocketBase] Loaded', records.length, 'users')
        return records
    } catch (error) {
        console.error('Error fetching users:', error)
        throw error
    }
}

/**
 * Get a specific user by ID
 */
export async function getUser(userId) {
    try {
        const record = await pb.collection('users').getOne(userId)
        return record
    } catch (error) {
        console.error('Error fetching user:', error)
        throw error
    }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email) {
    try {
        const record = await pb.collection('users').getFirstListItem(`email="${email}"`)
        return record
    } catch (error) {
        // Not found is okay
        if (error.status === 404) return null
        console.error('Error fetching user by email:', error)
        throw error
    }
}

/**
 * Create or update user with role
 */
export async function upsertUser(userData) {
    try {
        // Check if user exists
        const existing = await getUserByEmail(userData.email)

        if (existing) {
            // Update existing user
            const updated = await pb.collection('users').update(existing.id, userData)
            console.log('✅ [PocketBase] User updated:', updated.id)
            return updated
        } else {
            // Create new user
            const created = await pb.collection('users').create(userData)
            console.log('✅ [PocketBase] User created:', created.id)
            return created
        }
    } catch (error) {
        console.error('Error upserting user:', error)
        throw error
    }
}

/**
 * Update user role
 */
export async function updateUserRole(userId, role) {
    try {
        const updated = await pb.collection('users').update(userId, { role })
        console.log('✅ [PocketBase] User role updated:', userId, '->', role)
        return updated
    } catch (error) {
        console.error('Error updating user role:', error)
        throw error
    }
}

/**
 * Delete user
 */
export async function deleteUser(userId) {
    try {
        await pb.collection('users').delete(userId)
        console.log('✅ [PocketBase] User deleted:', userId)
    } catch (error) {
        console.error('Error deleting user:', error)
        throw error
    }
}

/**
 * Get available roles from the roles collection
 */
export async function getRoles() {
    try {
        const records = await pb.collection('roles').getFullList({
            sort: 'name',
        })
        console.log('✅ [PocketBase] Loaded', records.length, 'roles')
        return records
    } catch (error) {
        console.error('Error fetching roles:', error)
        // Return default roles if collection doesn't exist
        return [
            { id: 'manager', name: 'manager', label: 'Manager' },
            { id: 'editor', name: 'editor', label: 'Editor' }
        ]
    }
}
