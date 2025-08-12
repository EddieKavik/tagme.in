import http from 'node:http'
import { dirname, join } from 'node:path'
import querystring from 'node:querystring'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'

import { civilMemoryKV } from '../../dist/index.js'
import { collectRequestBody } from './collectRequestBody.mjs'

const DEFAULT_PORT = 3333

const TEST_DIR = dirname(import.meta.url.replace('file://', ''))

const STORAGE_DIR = join(TEST_DIR, '.tmp-kv')

async function main() {
 const indexHtml = (await readFile(join(TEST_DIR, 'index.html'))).toString(
  'utf-8'
 )
 const faviconIco = await readFile(join(TEST_DIR, 'favicon.ico'))
 const portEnv = parseInt(process.env.PORT, 10)
 const port =
  Number.isFinite(portEnv) && portEnv >= 1 && portEnv < 65536
   ? portEnv
   : DEFAULT_PORT

 const diskKV = civilMemoryKV.disk({
  rootDir: STORAGE_DIR,
  fsPromises: { mkdir, readFile, unlink, writeFile },
  path: { join },
 })
 const volatileKV = civilMemoryKV.volatile()

 function getKVByMode(mode, params) {
  switch (mode) {
   case 'disk':
    return diskKV
   case 'http':
    const httpUrl = params.url
    if (typeof httpUrl !== 'string') {
     const err = new Error(`parameter url must be specified for 'http' mode`)
     err.statusCode = 400
     throw err
    }
    return civilMemoryKV.http({ baseUrl: httpUrl })
   case 'volatile':
    return volatileKV
   default:
    const err = new Error(
     'parameter mode must be one of: cloudflare, disk, http, vercel, volatile'
    )
    err.statusCode = 400
    throw err
  }
 }

 const TEST_REQUEST_KEYS = ['mykey', 'mynamespace#mykey']
 const TEST_REQUEST_BODY = JSON.stringify({ example: 'myvalue' })

 const httpServer = http.createServer(async function (request, response) {
  try {
   const [requestPath, requestParamString] = request.url.split('?')
   const requestParams = querystring.parse(requestParamString ?? '')
   console.log(request.method, requestPath, JSON.stringify(requestParams))
   switch (request.method) {
    case 'DELETE': {
     const kv = getKVByMode(requestParams.mode, requestParams)
     if (typeof requestParams.key !== 'string') {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'request parameter key missing' }))
      return
     }
     await kv.delete(requestParams.key)
     response.statusCode = 200
     response.end()
     return
    }
    case 'GET': {
     if (request.url === '/') {
      response.statusCode = 200
      response.end(indexHtml)
      return
     }
     if (request.url === '/favicon.ico') {
      response.statusCode = 200
      response.setHeader('Content-Type', 'image/x-icon')
      response.end(faviconIco)
      return
     }
     const kv = getKVByMode(requestParams.mode, requestParams)
     if (typeof requestParams.key !== 'string') {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'request parameter key missing' }))
      return
     }
     response.statusCode = 200
     response.end((await kv.get(requestParams.key)) ?? '')
     return
    }
    case 'POST': {
     const kv = getKVByMode(requestParams.mode, requestParams)
     if (typeof requestParams.key !== 'string') {
      response.statusCode = 400
      response.end(JSON.stringify({ error: 'request parameter key missing' }))
      return
     }
     if (!TEST_REQUEST_KEYS.includes(requestParams.key)) {
      response.statusCode = 400
      response.end(
       JSON.stringify({
        error: `request parameter key must be one of ${JSON.stringify(
         TEST_REQUEST_KEYS
        )}`,
       })
      )
      return
     }
     const requestBody = await collectRequestBody(request)
     if (requestBody !== TEST_REQUEST_BODY) {
      response.statusCode = 400
      response.end(
       JSON.stringify({
        error: `request body must be ${JSON.stringify(TEST_REQUEST_BODY)}`,
       })
      )
      return
     }
     await kv.set(requestParams.key, requestBody)
     response.statusCode = 200
     response.end()
     return
    }
    default: {
     response.statusCode = 405
     response.end('invalid method')
     return
    }
   }
  } catch (e) {
   console.error(e)
   response.statusCode = e.statusCode ?? 500
   response.setHeader('Content-Type', 'text/plain; charset=utf-8')
   response.end(e.message)
  }
 })

 httpServer.listen(port, 'localhost', function () {
  console.log(
   `Test suite ready at http://localhost:${port}

Valid values for the mode parameter:
 • disk
 • volatile

All API operations:

 • Read value at key
   GET ?mode=disk&key=urlEncodedKey

 • Delete value at key
   DELETE ?mode=disk&key=urlEncodedKey

 • Write value at key
   POST ?mode=disk&key=urlEncodedKey <body>`
  )
 })
}

main().catch(function (e) {
 console.error(e)
})
