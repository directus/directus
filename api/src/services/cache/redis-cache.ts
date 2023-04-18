import env from '../../env.js';
import logger from '../../logger.js';
import { getConfigFromEnv } from '../../utils/get-config-from-env.js';
import { CacheOptions, CacheService } from './cache.js';
import { parse, stringify } from 'json-buffer';
import { compress, decompress } from '../../utils/compress.js';
import { map } from 'async';
import { merge } from 'lodash-es';
import { Redis } from 'ioredis';
import { toArray } from '@directus/utils';

export class RedisCache extends CacheService {
	client: Redis;

	constructor(options: CacheOptions) {
		super(options);

		this.client = new Redis(this.getConfig());
		this.client.on('error', (err) => logger.warn(err, `[cache] ${err}`));
	}

	private getConfig() {
		if ('CACHE_REDIS' in env) return env['CACHE_REDIS'];
		return merge({}, getConfigFromEnv('REDIS_'), getConfigFromEnv('CACHE_REDIS_'));
	}

	async get(key: string): Promise<any | null> {
		const value = await this.client.get(this.addPrefix(key));

		if (value === null) return null;

		return await decompress(parse(value));
	}

	async keys(pattern?: string | undefined): Promise<string[]> {
		return new Promise((resolve) => {
			const keys: string[] = [];

			const stream = this.client.scanStream({
				match: this.addPrefix(pattern || '*'),
			});

			stream.on('data', (resultKeys) => {
				for (let i = 0; i < resultKeys.length; i++) {
					keys.push(resultKeys[i]);
				}
			});

			stream.on('end', () => {
				resolve(keys);
			});
		});
	}

	async set(key: string, value: any, ttl: number | undefined = this.ttl): Promise<void> {
		if (await this.isLocked()) return;

		const _key = this.addPrefix(key);

		await this.client.set(_key, stringify(await compress(value)));
		if (ttl !== undefined) await this.client.expire(_key, ttl);
	}

	async clear(): Promise<void> {
		await this.client.flushall();
	}

	async delete(key: string): Promise<void> {
		await this.client.del(this.addPrefix(key));
	}

	async setHash(key: string, value: Record<string, any>, ttl?: number | undefined): Promise<void> {
		if (await this.isLocked()) return;

		const _key = this.addPrefix(key);

		const values = [];

		for (const [key, val] of Object.entries(value)) {
			values.push(key, stringify(await compress(val)));
		}

		values.push('#full', 'true');
		await this.client.hset(_key, ...values);

		if (ttl !== undefined) await this.client.expire(_key, ttl);
	}

	async getHash(key: string): Promise<Record<string, any> | null> {
		const value = await this.client.hgetall(this.addPrefix(key));
		if (value === null) return null;
		const entries = Object.entries(value).filter(([key]) => !key.startsWith('#'));

		return Object.fromEntries(
			await map(entries, async ([key, val]: [string, any]) => [key, await decompress(parse(val))])
		);
	}

	async isHashFull(key: string): Promise<boolean> {
		return (await this.client.hget(this.addPrefix(key), '#full')) === 'true';
	}

	async setHashField(key: string, field: string, value: any, ttl?: number | undefined): Promise<void> {
		if (await this.isLocked()) return;

		const _key = this.addPrefix(key);

		await this.client.hset(_key, field, stringify(await compress(value)));
		if (ttl !== undefined) await this.client.expire(_key, ttl);
	}

	async getHashField(key: string, field: string): Promise<any | null> {
		const value = await this.client.hget(this.addPrefix(key), field);

		if (value === undefined || value === null) return null;

		return await decompress(parse(value));
	}

	async deleteHashField(key: string, field: string | string[]): Promise<void> {
		const fields = toArray(field);
		await this.client.hdel(this.addPrefix(key), '$full', ...fields);
	}
}
