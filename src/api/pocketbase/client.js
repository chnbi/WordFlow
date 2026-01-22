// PocketBase Client
// Initializes the PocketBase SDK with the server URL

import PocketBase from 'pocketbase'

const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090')

// Enable auto-refresh of auth token
pb.autoCancellation(false)

export default pb
