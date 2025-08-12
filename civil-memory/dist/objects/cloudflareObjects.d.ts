import type { R2Bucket } from '@cloudflare/workers-types';
import { CivilMemoryObjects } from '..';
export declare function cloudflareObjects({ binding, }: {
    binding: R2Bucket;
}): CivilMemoryObjects;
