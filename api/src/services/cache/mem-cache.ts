import { CacheService } from "./cache.js";
import { compress, decompress } from '../../utils/compress.js';

export class MemCache extends CacheService {
    
    store = new Map<string, any>();
    expires = new Map<string, number>();

    async get(key: string): Promise<any> {
        const _key = this.addPrefix(key);
        const expired = this.expires.get(_key) ?? -1;

        if(Date.now() > expired) {
            this.store.delete(_key);
            this.expires.delete(_key);
            return undefined;
        }

        return await decompress(this.store.get(key))
    }

    async set(key: string, value: any, ttl: number | undefined = this.ttl): Promise<void> {
        const _key = this.addPrefix(key);
        this.store.set(_key, await compress(value));

        if(ttl !== undefined && ttl > 0) {
            const expires = Date.now() + ttl;
            this.expires.set(_key, expires);
        }
    }

    clear(): Promise<void> {
        this.store.clear()
        this.expires.clear();
        return Promise.resolve();
    }

    delete(key: string): Promise<void> {
        const _key = this.addPrefix(key);

        this.store.delete(_key);
        this.expires.delete(_key);
        return Promise.resolve();
    }
    
}