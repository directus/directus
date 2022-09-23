import { getCache } from "../../cache.js";

export interface CacheOptions {
    ttl: number | undefined;
    namespace: string;
    checkLock: boolean;
}

export abstract class CacheService {

    ttl: number | undefined;
    namespace: string;
    KEY_BLACKLIST = ['lock']

    constructor(options: CacheOptions) {
        this.ttl = options?.ttl;
        this.namespace = options.namespace;
    }

    abstract get(key: string): Promise<any | null>;
    abstract set(key: string, value: any, ttl?: number): Promise<void>;
    abstract keys(pattern?: string): Promise<string[]>;
    abstract clear(): Promise<void>;
    abstract delete(key: string | string[]): Promise<void>;
    
    abstract setHash(key: string, value: Record<string, any>, ttl?: number): Promise<void>;
    abstract getHash(key: string): Promise<Record<string, any> | null>;
    abstract isHashFull(key: string): Promise<boolean>;
    abstract setHashField(key: string, field: string, value: any, ttl?: number): Promise<void>;
    abstract getHashField(key: string, field: string): Promise<any | null>;
    abstract deleteHashField(key: string, field: string | string[]): Promise<void>;

    addPrefix(key: string) {
        return this.namespace ? `${this.namespace}:${key}` : key;
    };

    removePrefix(key: string) {
        return this.namespace ? key.replace(`${this.namespace}:`, '') : key;
    }

    async setHashFull(key: string, full: boolean) {
        await this.setHashField(key, '#full', full)
    }

    async autoCache<T>(key: string, fn: () => Promise<T>, ttl?: number | undefined): Promise<T> {
        let value = await this.get(key)

        if (value !== null) return value;

        value = await fn()
        await this.set(key, value, ttl)

        return value
    }

    async autoCacheHash<T extends Record<string, any>>(key: string, fn: () => Promise<T>, ttl?: number | undefined): Promise<T> {
        let value = await this.getHash(key)

        if (value !== null && await this.isHashFull(key)) {
            return value as T
        };
 
        value = await fn()
        await this.setHash(key, value, ttl)

        return value as T
    }

    async autoCacheHashField<T>(key: string, field: string, fn: () => Promise<T>, ttl?: number | undefined): Promise<T> {
        let value = await this.getHashField(key, field)
        if (value !== null) {
            return value
        };

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
        return (await lockCache.get(this.addPrefix('lock'))) !== null
    }
}