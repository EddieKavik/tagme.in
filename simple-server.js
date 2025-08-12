import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

// Create HTTP server
const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname
  
  console.log(`${req.method} ${path}`)
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }
  
  // Handle API routes
  if (path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json')
    
    if (req.method === 'GET') {
      res.writeHead(200)
      res.end(JSON.stringify({ message: 'API endpoint', path }))
    } else if (req.method === 'POST') {
      let body = ''
      req.on('data', chunk => {
        body += chunk.toString()
      })
      req.on('end', () => {
        res.writeHead(200)
        res.end(JSON.stringify({ message: 'POST endpoint', path, data: body }))
      })
    } else {
      res.writeHead(405)
      res.end(JSON.stringify({ error: 'Method not allowed' }))
    }
    return
  }
  
  // Serve static files
  let filePath = path === '/' ? '/index.html' : path
  const file = serveStaticFile(filePath)
  
  if (file) {
    res.setHeader('Content-Type', file.contentType)
    res.writeHead(200)
    res.end(file.content)
  } else {
    res.setHeader('Content-Type', 'application/json')
    res.writeHead(404)
    res.end(JSON.stringify({ error: 'Not found', path }))
  }
})

const PORT = 8788
server.listen(PORT, () => {
  console.log(`Tagmein server running on http://localhost:${PORT}`)
  console.log('Make sure civil-memory KV server is running on http://localhost:3333')
})
