import { getCache } from "../../cache";

export interface CacheOptions {
    ttl: number | undefined;
    namespace: string;
    checkLock: boolean;
}

export abstract class CacheService {

    ttl: number | undefined;
    namespace: string;

    constructor(options: CacheOptions) {
        this.ttl = options?.ttl;
        this.namespace = options.namespace;
    }

    abstract get(key: string): Promise<any>;
    abstract set(key: string, value: any, ttl?: number): Promise<void>;
    abstract clear(): Promise<void>;
    abstract delete(key: string): Promise<void>;
    
    abstract setHash(key: string, value: Record<string, any>, ttl?: number): Promise<void>;
    abstract getHash(key: string): Promise<Record<string, any>>;
    abstract setHashField(key: string, field: string, value: any, ttl?: number): Promise<void>;
    abstract getHashField(key: string, field: string): Promise<any>;

    addPrefix(key: string) {
        return this.namespace ? `${this.namespace}:${key}` : key;
    };

    removePrefix(key: string) {
        return this.namespace ? key.replace(`${this.namespace}:`, '') : key;
    }

    async autoCache<T>(key: string, ttl: number | undefined, fn: () => Promise<T>): Promise<T> {
        let value = await this.get(key)

        if (value !== undefined) return value;

        value = await fn()
        await this.set(key, value, ttl)

        return value
    }

    async autoCacheHash(key: string, ttl: number | undefined, fn: () => Promise<Record<string, any>>): Promise<Record<string, any>> {
        let value = await this.getHash(key)

        if (value !== undefined) return value;

        value = await fn()
        await this.setHash(key, value, ttl)

        return value
    }

    async autoCacheHashField<T>(key: string, field: string, ttl: number | undefined, fn: () => Promise<T>): Promise<T> {
        let value = await this.getHashField(key, field)

        if (value !== undefined) return value;

        value = await fn()
        await this.setHashField(key, field, value, ttl)

        return value
    }

    async lock() {
        const {lockCache} = getCache()
        if(await this.isLocked()) return false

        await lockCache.set(this.addPrefix('lock'), true, 10000)

        return true
    }

    async unlock() {
        const {lockCache} = getCache()
        await lockCache.delete(this.addPrefix('lock'))
    }

    async isLocked() {
        const {lockCache} = getCache()
        return await lockCache.get(this.addPrefix('lock')) !== undefined
    }
}