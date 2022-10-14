import { cloneDeep } from "lodash-es";
import { CacheService } from "./cache.js";
import LRU from "lru-cache";

export class MemCache extends CacheService {
    store = new LRU<string, any>({
        max: 2000,
    });

    async get(key: string): Promise<any | null> {
        const _key = this.addPrefix(key);

        return this.store.get(_key) ?? null
    }

    async set(key: string, value: any, ttl: number | undefined = this.ttl): Promise<void> {
        if(await this.isLocked()) return

        const _key = this.addPrefix(key);
        this.store.set(_key, value, { ttl });
    }

    async keys(pattern?: string | undefined): Promise<string[]> {
        const allKeys = [...this.store.keys()].map(key => this.removePrefix(key))

        if(pattern === undefined) return allKeys;

        return allKeys.filter(key => new RegExp(pattern).test(key));
    }

    async clear(): Promise<void> {
        this.store.clear()
    }

    async delete(key: string | string[]): Promise<void> {
        const keys = Array.isArray(key) ? key : [key];

        for(const key of keys) {
            const _key = this.addPrefix(key);

            this.store.delete(_key);
        }
    }

    async setHash(key: string, value: Record<string, any>, ttl?: number | undefined): Promise<void> {
        return await this.set(key, {...value, '#full': 'true'}, ttl);
    }
    async getHash(key: string): Promise<Record<string, any> | null> {
        const value = await this.get(key)

        if(value === null) return null;

        return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('#')));
    }
    
    async isHashFull(key: string): Promise<boolean> {
        const value = await this.get(key)
        return value?.['#full'] === 'true';
    }

    async setHashField(key: string, field: string, value: any, ttl?: number | undefined): Promise<void> {
        const localValue = cloneDeep(await this.get(key)) ?? {}

        if(typeof localValue !== 'object') throw new Error('Cannot set hash field on non-object value');

        localValue[field] = value;

        await this.set(key, localValue, ttl);
    }
    async getHashField(key: string, field: string): Promise<any | null> {
        const value = await this.get(key)

        if(value === null) return null;
        if(typeof value !== 'object') throw new Error('Cannot get hash field on non-object value');

        return value[field]
    }
    
    async deleteHashField(key: string, field: string | string[]): Promise<void> {
        const localValue = cloneDeep(await this.get(key)) ?? {}

        if(typeof localValue !== 'object') throw new Error('Cannot set hash field on non-object value');

        const fields = Array.isArray(field) ? field : [field];

        for(const field of fields) {
            delete localValue[field];
        }
        delete localValue['#full'];

        await this.set(key, localValue);
    }
}