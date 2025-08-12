import type { VercelRequest, VercelResponse } from '@vercel/node'
import { civilMemoryKV } from '@tagmein/civil-memory'

const TEST_REQUEST_KEYS = ['mykey', 'mynamespace#mykey']
const TEST_REQUEST_BODY = JSON.stringify({ example: 'myvalue' })

export default async function (
 request: VercelRequest,
 response: VercelResponse
) {
 const { KV_REST_API_URL, KV_REST_API_TOKEN } = process.env

 if (typeof KV_REST_API_TOKEN !== 'string') {
  throw new Error('KV_REST_API_TOKEN environment variable is missing')
 }

 if (typeof KV_REST_API_URL !== 'string') {
  throw new Error('KV_REST_API_URL environment variable is missing')
 }

 const kv = await civilMemoryKV.vercel({
  url: KV_REST_API_URL,
  token: KV_REST_API_TOKEN,
 })

 const { key, mode } = request.query

 if (mode !== 'vercel') {
  return response.status(400).end(`mode parameter must be 'vercel'`)
 }

 if (typeof key !== 'string') {
  return response.status(400).end(`key parameter must be a single string`)
 }

 if (!TEST_REQUEST_KEYS.includes(key)) {
  return response
   .status(400)
   .end(`request body must be one of ${JSON.stringify(TEST_REQUEST_KEYS)}`)
 }

 if (request.method === 'GET') {
  const value = await kv.get(key)
  return response.status(200).send(value)
 }

 if (request.method === 'DELETE') {
  await kv.delete(key)
  return response.status(200).end()
 }

 if (request.method === 'POST') {
  const value = request.body
  if (value !== TEST_REQUEST_BODY) {
   return response
    .status(400)
    .end(`request body must be ${JSON.stringify(TEST_REQUEST_BODY)}`)
  }
  await kv.set(key, value)
  return response.status(200).end()
 }

 return response.status(405).end()
}
