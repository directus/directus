import { createClient, RedisClientType } from "redis";
import env from "../../env";
import logger from "../../logger";
import { getConfigFromEnv } from "../../utils/get-config-from-env";
import { CacheOptions, CacheService } from "./cache";


export class RedisCache extends CacheService {

    client: RedisClientType

    constructor(options?: CacheOptions) {
        super(options);

        this.client = createClient({
            url: env.CACHE_REDIS || getConfigFromEnv('CACHE_REDIS_')
        })
        this.client.on('error', (err) => logger.warn(err, `[cache] ${err}`))
        this.client.connect()
    }

    async get(key: string): Promise<any> {
        return await this.client.get(this.addPrefix(key)) ?? undefined
    }
    async set(key: string, value: any, ttl: number | undefined = this.ttl): Promise<void> {
        const _key = this.addPrefix(key)

        await this.client.set(_key, value)
        if(ttl !== undefined) await this.client.expire(_key, ttl);
    }
    async clear(): Promise<void> {
        await this.client.flushAll()
    }
    async delete(key: string): Promise<void> {
        await this.client.del(this.addPrefix(key))
    }
    
}