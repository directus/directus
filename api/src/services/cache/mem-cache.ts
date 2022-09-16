import { cloneDeep } from "lodash-es";
import { CacheService } from "./cache.js";

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

        return this.store.get(key)
    }

    async set(key: string, value: any, ttl: number | undefined = this.ttl): Promise<void> {
        if(await this.isLocked()) return

        const _key = this.addPrefix(key);
        this.store.set(_key, value);

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

    setHash(key: string, value: Record<string, any>, ttl?: number | undefined): Promise<void> {
        return this.set(key, value, ttl);
    }
    getHash(key: string): Promise<Record<string, any>> {
        return this.get(key);
    }
    async setHashField(key: string, field: string, value: any, ttl?: number | undefined): Promise<void> {
        const localValue = cloneDeep(await this.get(key)) ?? {}

        if(typeof localValue !== 'object') throw new Error('Cannot set hash field on non-object value');

        localValue[field] = value;

        this.set(key, localValue, ttl);
    }
    async getHashField(key: string, field: string): Promise<any> {
        const value = await this.get(key)

        if(typeof value !== 'object') throw new Error('Cannot get hash field on non-object value');

        return value[field]
    }
    
}