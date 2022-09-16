import { createClient, RedisClientType } from "redis";
import env from "../../env.js";
import logger from "../../logger.js";
import { getConfigFromEnv } from "../../utils/get-config-from-env.js";
import { CacheOptions, CacheService } from "./cache.js";
import {parse, stringify} from 'json-buffer'
import { compress, decompress } from '../../utils/compress.js';

export class RedisCache extends CacheService {

    client: RedisClientType

    constructor(options?: CacheOptions) {
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
    
}