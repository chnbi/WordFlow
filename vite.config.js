import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function readGit(...args) {
    try {
        return execFileSync('git', args, {
            cwd: __dirname,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
            timeout: 2000,
            windowsHide: true,
        }).trim()
    } catch {
        return ''
    }
}

// Only publish build identifiers, never the full environment or credentials.
const buildInfo = {
    version: JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf8')).version,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || readGit('rev-parse', 'HEAD'),
}

export default defineConfig({
    base: '/wordflow/',
    define: {
        'import.meta.env.VITE_BUILD_INFO': JSON.stringify(buildInfo),
    },
    plugins: [
        react(),
        nodePolyfills({
            // Whether to polyfill `node:` protocol imports.
            protocolImports: true,
        }),
    ],
    // Environment variable prefix
    envPrefix: ['VITE_'],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    // Strip all console.* and debugger statements in production builds
    esbuild: {
        drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    },
    optimizeDeps: {
        include: ['pdfjs-dist'],
    },
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/functions'],
                    'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-slot', '@radix-ui/react-avatar', 'lucide-react', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
                    'vendor-office': ['xlsx', 'pptxgenjs', 'docx', 'mammoth'],
                    'vendor-pdf': ['pdfjs-dist'],
                    'vendor-ai': ['@google/genai'],
                }
            }
        }
    },
    server: {
        proxy: {
            '/proxy/ilmuchat': {
                target: 'https://api.ilmu.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/ilmuchat/, '')
            }
        }
    }
})
