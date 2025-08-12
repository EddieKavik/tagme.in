import type {
 R2Bucket,
 ReadableStream as CFReadableStream,
} from '@cloudflare/workers-types'
import { CivilMemoryObjects } from '..'

export function cloudflareObjects({
 binding,
}: {
 binding: R2Bucket
}): CivilMemoryObjects {
 return {
  async delete(key) {
   await binding.delete(key)
  },

  async get(key) {
   const obj = await binding.get(key)
   if (!obj) {
    return null
   }

   return obj.body as ReadableStream
  },

  async info(key) {
   const obj = await binding.head(key)
   return obj
    ? {
       createdAt: obj.uploaded,
       key: obj.key,
       size: obj.size,
      }
    : {
       createdAt: new Date(0),
       key,
       size: 0,
      }
  },

  async put(key, value) {
   await binding.put(key, value as CFReadableStream)
  },
 }
}
