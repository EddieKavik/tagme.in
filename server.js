import { civilMemoryKV } from './functions/modules/civil-memory/index.mjs'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize KV store
const kv = civilMemoryKV.http({
  baseUrl: 'http://localhost:3333?mode=disk&modeOptions.disk.basePath=./.kv-public'
})

// MIME types for static files
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
}

// Simple static file server
function serveStaticFile(path) {
  const publicPath = join(__dirname, 'public', path)
  
  if (!existsSync(publicPath)) {
    return null
  }
  
  const ext = extname(publicPath)
  const contentType = mimeTypes[ext] || 'application/octet-stream'
  
  try {
    const content = readFileSync(publicPath)
    return { content, contentType }
  } catch (error) {
    console.error('Error reading file:', error)
    return null
  }
}

// Simple server
const server = civilMemoryKV.http({
  baseUrl: 'http://localhost:8788'
})

// Handle requests
server.get = async (key) => {
  const url = new URL(key)
  const path = url.pathname
  
  console.log('Request:', path)
  
  // Handle API routes
  if (path.startsWith('/api/')) {
    // For now, return a simple response
    return JSON.stringify({ message: 'API endpoint', path })
  }
  
  // Serve static files
  let filePath = path === '/' ? '/index.html' : path
  const file = serveStaticFile(filePath)
  
  if (file) {
    return file.content.toString()
  }
  
  // Return 404
  return JSON.stringify({ error: 'Not found', path })
}

server.set = async (key, value) => {
  const url = new URL(key)
  const path = url.pathname
  
  console.log('POST Request:', path, value)
  
  // Handle API POST requests
  if (path.startsWith('/api/')) {
    return JSON.stringify({ message: 'POST endpoint', path, data: value })
  }
  
  return 'OK'
}

console.log('Tagmein server running on http://localhost:8788')
console.log('Make sure civil-memory KV server is running on http://localhost:3333')
