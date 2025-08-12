import { CivilMemoryKV } from '..'

export async function vercelKV({
 token,
 url,
}: {
 token: string
 url: string
}): Promise<CivilMemoryKV> {
 const kv = (await import('@vercel/kv')).createClient({
  token,
  url,
 })
 return {
  async delete(key) {
   await kv.getdel(key)
  },
  async get(key) {
   return kv.get(key)
  },
  async set(key, value) {
   await kv.set(key, JSON.stringify(value))
  },
 }
}
