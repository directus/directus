import { createClient, RedisClientType } from "redis";
import env from "../../env.js";
import logger from "../../logger.js";
import { getConfigFromEnv } from "../../utils/get-config-from-env.js";
import { CacheOptions, CacheService } from "./cache.js";
import {parse, stringify} from 'json-buffer'
import { compress, decompress } from '../../utils/compress.js';

export class RedisCache extends CacheService {
    client: RedisClientType

    constructor(options: CacheOptions) {
        super(options);

        this.client = createClient({
            url: env["CACHE_REDIS"] || getConfigFromEnv('CACHE_REDIS_')
        })
        this.client.on('error', (err) => logger.warn(err, `[cache] ${err}`))
        this.client.connect()
    }

    async get(key: string): Promise<any> {
        const value = await this.client.get(this.addPrefix(key))

        if(value === null) return undefined;

        return await decompress(parse(value))
    }
    async set(key: string, value: any, ttl: number | undefined = this.ttl): Promise<void> {
        if(await this.isLocked()) return

        const _key = this.addPrefix(key)

        await this.client.set(_key, stringify(await compress(value)))
        if(ttl !== undefined) await this.client.expire(_key, ttl);
    }
    async clear(): Promise<void> {
        await this.client.flushAll()
    }
    async delete(key: string): Promise<void> {
        await this.client.del(this.addPrefix(key))
    }

    async setHash(key: string, value: Record<string, any>, ttl?: number | undefined): Promise<void> {
        if(await this.isLocked()) return

        const _key = this.addPrefix(key)

        const values = []

        for(const [key, val] of Object.entries(value)) {
            values.push(key, stringify(await compress(val)))
        }

        await this.client.sendCommand(['HSET', _key, ...values])
        if(ttl !== undefined) await this.client.expire(_key, ttl);
    }
    async getHash(key: string): Promise<Record<string, any>> {
        return await this.client.hGetAll(this.addPrefix(key))
    }
    async setHashField(key: string, field: string, value: any, ttl?: number | undefined): Promise<void> {
        if(await this.isLocked()) return

        const _key = this.addPrefix(key)

        await this.client.hSet(_key, field, stringify(await compress(value)))
        if(ttl !== undefined) await this.client.expire(_key, ttl);
    }
    async getHashField(key: string, field: string): Promise<any> {
        return await this.client.hGet(this.addPrefix(key), field)
    }
    
}