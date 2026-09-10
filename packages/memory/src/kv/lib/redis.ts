import { Redlock } from '@sesamecare-oss/redlock';
import {
	bufferToUint8Array,
	compress,
	decompress,
	deserialize,
	isCompressed,
	serialize,
	uint8ArrayToBuffer,
	withNamespace,
} from '../../utils/index.js';
import type { ExtendedRedis, KvConfigRedis } from '../index.js';
import type { Kv } from '../types/class.js';

/**
 * How many keys each `SCAN` pass asks Redis to cover while clearing the namespaced key layout.
 * Redis treats this as a hint, so a pass can return a few more or fewer than this
 */
export const CLEAR_SCAN_COUNT = 1000;

export const SET_MAX_SCRIPT = `
  local key = KEYS[1]
  local value = tonumber(ARGV[1])

  if redis.call("EXISTS", key) == 1 then
    local oldValue = tonumber(redis.call('GET', key))

    if value <= oldValue then
      return 0
    end
  end

  redis.call('SET', key, value)

  return 1
`;

export const SET_MAX_FIELD_SCRIPT = `
  local hash = KEYS[1]
  local field = ARGV[1]
  local value = tonumber(ARGV[2])
  local ttl = tonumber(ARGV[3])

  local oldValue = redis.call('HGET', hash, field)

  if oldValue and value <= tonumber(oldValue) then
    return 0
  end

  redis.call('HSET', hash, field, value)

  if ttl > 0 then
    redis.call('PEXPIRE', hash, ttl)
  end

  return 1
`;

const RELEASE_SCRIPT = `
	if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
	else
	return 0
	end
`;

export class KvRedis implements Kv {
	private redis: ExtendedRedis;
	private namespace: string;
	private compression: boolean;
	private compressionMinSize: number;
	private lockTimeout: number;
	private redlock;
	private ttl: number | undefined;
	private hash: boolean;

	constructor(config: Omit<KvConfigRedis, 'type'>) {
		if ('setMax' in config.redis === false) {
			config.redis.defineCommand('setMax', {
				numberOfKeys: 1,
				lua: SET_MAX_SCRIPT,
			});
		}

		if ('setMaxField' in config.redis === false) {
			config.redis.defineCommand('setMaxField', {
				numberOfKeys: 1,
				lua: SET_MAX_FIELD_SCRIPT,
			});
		}

		if ('release' in config.redis === false) {
			config.redis.defineCommand('release', {
				numberOfKeys: 1,
				lua: RELEASE_SCRIPT,
			});
		}

		this.redis = config.redis as ExtendedRedis;
		this.namespace = config.namespace;
		this.compression = config.compression ?? true;
		this.compressionMinSize = config.compressionMinSize ?? 1000;
		this.lockTimeout = config.lockTimeout ?? 5000;
		this.hash = config.hash ?? false;

		this.redlock = new Redlock([this.redis], {
			retryDelay: 50,
			driftFactor: 0.01,
			retryCount: 100,
			retryJitter: 20,
		});

		this.ttl = config.ttl;
	}

	async get<T = unknown>(key: string): Promise<T | undefined> {
		const value = this.hash
			? await this.redis.hgetBuffer(this.namespace, key)
			: await this.redis.getBuffer(withNamespace(key, this.namespace));

		if (value === null) {
			return undefined;
		}

		let binaryArray = bufferToUint8Array(value);

		if (this.compression === true && isCompressed(binaryArray)) {
			binaryArray = await decompress(binaryArray);
		}

		return <T>deserialize(binaryArray);
	}

	async set<T = unknown>(key: string, value: T): Promise<void> {
		if (typeof value === 'number') {
			await this.write(key, String(value));
			return;
		}

		let binaryArray = serialize(value);

		if (this.compression === true && binaryArray.byteLength >= this.compressionMinSize) {
			binaryArray = await compress(binaryArray);
		}

		await this.write(key, uint8ArrayToBuffer(binaryArray));
	}

	async delete(key: string): Promise<void> {
		if (this.hash) {
			await this.redis.hdel(this.namespace, key);
			return;
		}

		await this.redis.unlink(withNamespace(key, this.namespace));
	}

	async has(key: string): Promise<boolean> {
		const exists = this.hash
			? await this.redis.hexists(this.namespace, key)
			: await this.redis.exists(withNamespace(key, this.namespace));

		return exists !== 0;
	}

	async increment(key: string, amount = 1): Promise<number> {
		if (this.hash === false) {
			return await this.redis.incrby(withNamespace(key, this.namespace), amount);
		}

		if (!this.ttl) {
			return await this.redis.hincrby(this.namespace, key, amount);
		}

		const results = await this.redis
			.multi()
			.hincrby(this.namespace, key, amount)
			.pexpire(this.namespace, this.ttl)
			.exec();

		return results?.[0]?.[1] as number;
	}

	async setMax(key: string, value: number): Promise<boolean> {
		const wasSet = this.hash
			? await this.redis.setMaxField(this.namespace, key, value, this.ttl ?? 0)
			: await this.redis.setMax(withNamespace(key, this.namespace), value);

		return wasSet !== 0;
	}

	async acquireLock(key: string): Promise<{
		release: () => Promise<void>;
		extend: (duration: number) => Promise<void>;
	}> {
		const lock = await this.redlock.acquire([withNamespace(key, this.namespace)], Math.floor(this.lockTimeout));

		return {
			release: async () => {
				await lock.release();
			},
			extend: async (duration: number) => {
				await lock.extend(duration);
			},
		};
	}

	async usingLock<T>(key: string, callback: () => Promise<T>): Promise<T> {
		return this.redlock.using([withNamespace(key, this.namespace)], Math.floor(this.lockTimeout), callback);
	}

	async clear(): Promise<void> {
		if (this.hash) {
			await this.redis.unlink(this.namespace);
			return;
		}

		const keysStream = this.redis.scanStream({
			match: withNamespace('*', this.namespace),
			count: CLEAR_SCAN_COUNT,
		});

		const pipeline = this.redis.pipeline();

		for await (const keys of keysStream) {
			pipeline.unlink(keys);
		}

		await pipeline.exec();
	}

	/**
	 * Write the given value to the store, refreshing the namespace-wide TTL when the hash layout is
	 * used and a TTL is configured
	 */
	private async write(key: string, value: string | Buffer): Promise<void> {
		if (this.hash === false) {
			if (this.ttl) {
				await this.redis.set(withNamespace(key, this.namespace), value, 'PX', this.ttl);
			} else {
				await this.redis.set(withNamespace(key, this.namespace), value);
			}

			return;
		}

		if (!this.ttl) {
			await this.redis.hset(this.namespace, key, value);
			return;
		}

		await this.redis.multi().hset(this.namespace, key, value).pexpire(this.namespace, this.ttl).exec();
	}
}
