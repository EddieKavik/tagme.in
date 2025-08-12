import { cloudflareKV } from './kv/cloudflareKV'
import { diskKV } from './kv/diskKV'
import { httpKV } from './kv/httpKV'
import { vercelKV } from './kv/vercelKV'
import { volatileKV } from './kv/volatileKV'
import { cloudflareObjects } from './objects/cloudflareObjects'
import { diskObjects } from './objects/diskObjects'
import { vercelObjects } from './objects/vercelObjects'

export interface CivilMemoryKV {
 delete(key: string): Promise<void>
 get(key: string): Promise<string | null>
 set(key: string, value: string): Promise<void>
}

export interface CivilMemoryObjectsObjectInfo {
 createdAt: Date
 key: string
 size: number
}

export interface CivilMemoryObjects {
 delete(key: string): Promise<void>
 get(key: string): Promise<null | ReadableStream<Uint8Array>>
 info(key: string): Promise<CivilMemoryObjectsObjectInfo>
 put(key: string, value: ReadableStream<Uint8Array>): Promise<void>
 // signedUrlGet(key: string, expiresIn: number): Promise<string>
 // signedUrlPut(key: string, expiresIn: number): Promise<string>
}

type Named<T, N extends string> = T & { name: N }

export const civilMemoryKV = {
 cloudflare: cloudflareKV as Named<typeof cloudflareKV, 'cloudflare'>,
 disk: diskKV as Named<typeof diskKV, 'disk'>,
 http: httpKV as Named<typeof httpKV, 'http'>,
 vercel: vercelKV as Named<typeof vercelKV, 'vercel'>,
 volatile: volatileKV as Named<typeof volatileKV, 'volatile'>,
}

export const civilMemoryObjects = {
 cloudflare: cloudflareObjects as Named<typeof cloudflareObjects, 'cloudflare'>,
 disk: diskObjects as Named<typeof diskObjects, 'disk'>,
 vercel: vercelObjects as Named<typeof vercelObjects, 'vercel'>,
}
