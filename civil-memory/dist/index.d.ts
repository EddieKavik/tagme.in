import { cloudflareKV } from './kv/cloudflareKV';
import { diskKV } from './kv/diskKV';
import { httpKV } from './kv/httpKV';
import { vercelKV } from './kv/vercelKV';
import { volatileKV } from './kv/volatileKV';
import { cloudflareObjects } from './objects/cloudflareObjects';
import { diskObjects } from './objects/diskObjects';
import { vercelObjects } from './objects/vercelObjects';
export interface CivilMemoryKV {
    delete(key: string): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
}
export interface CivilMemoryObjectsObjectInfo {
    createdAt: Date;
    key: string;
    size: number;
}
export interface CivilMemoryObjects {
    delete(key: string): Promise<void>;
    get(key: string): Promise<null | ReadableStream<Uint8Array>>;
    info(key: string): Promise<CivilMemoryObjectsObjectInfo>;
    put(key: string, value: ReadableStream<Uint8Array>): Promise<void>;
}
type Named<T, N extends string> = T & {
    name: N;
};
export declare const civilMemoryKV: {
    cloudflare: Named<typeof cloudflareKV, "cloudflare">;
    disk: Named<typeof diskKV, "disk">;
    http: Named<typeof httpKV, "http">;
    vercel: Named<typeof vercelKV, "vercel">;
    volatile: Named<typeof volatileKV, "volatile">;
};
export declare const civilMemoryObjects: {
    cloudflare: Named<typeof cloudflareObjects, "cloudflare">;
    disk: Named<typeof diskObjects, "disk">;
    vercel: Named<typeof vercelObjects, "vercel">;
};
export {};
