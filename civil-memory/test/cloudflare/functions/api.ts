import type {
 KVNamespace,
 PagesFunction,
 Response as CWResponse,
} from '@cloudflare/workers-types'
import { civilMemoryKV } from '@tagmein/civil-memory'

interface Env {
 DATA_KV: KVNamespace
}

const TEST_REQUEST_KEYS = ['mykey', 'mynamespace#mykey']
const TEST_REQUEST_BODY = JSON.stringify({ example: 'myvalue' })

function validateKey(key: string | null): string | CWResponse {
 if (typeof key !== 'string') {
  return new Response(
   JSON.stringify({
    error: 'key parameter must be a string',
   }),
   { status: 400 }
  ) as unknown as CWResponse
 }
 if (!TEST_REQUEST_KEYS.includes(key)) {
  return new Response(
   JSON.stringify({
    error: `key parameter must be one of ${JSON.stringify(TEST_REQUEST_KEYS)}`,
   }),
   { status: 400 }
  ) as unknown as CWResponse
 }
 return key
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
 const { searchParams } = new URL(request.url)
 const key = validateKey(searchParams.get('key'))
 if (typeof key !== 'string') {
  return key
 }

 const kv = civilMemoryKV.cloudflare({
  binding: env.DATA_KV,
 })

 const value = await kv.get(key)

 return new Response(value) as unknown as CWResponse
}

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
 const { searchParams } = new URL(request.url)
 const key = validateKey(searchParams.get('key'))
 if (typeof key !== 'string') {
  return key
 }

 const kv = civilMemoryKV.cloudflare({
  binding: env.DATA_KV,
 })

 await kv.delete(key)

 return new Response() as unknown as CWResponse
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
 const { searchParams } = new URL(request.url)
 const key = validateKey(searchParams.get('key'))
 if (typeof key !== 'string') {
  return key
 }

 const kv = civilMemoryKV.cloudflare({
  binding: env.DATA_KV,
 })

 const value = await request.text()

 if (value !== TEST_REQUEST_BODY) {
  return new Response(
   JSON.stringify({
    error: `request body must be ${JSON.stringify(TEST_REQUEST_BODY)}`,
   }),
   { status: 400 }
  ) as unknown as CWResponse
 }

 await kv.set(key, value)

 return new Response() as unknown as CWResponse
}
