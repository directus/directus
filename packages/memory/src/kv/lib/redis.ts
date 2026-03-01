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

export const SET_MAX_SCRIPT = `
  local key = KEYS[1]
  local value = tonumber(ARGV[1])

  if redis.call("EXISTS", key) == 1 then
    local oldValue = tonumber(redis.call('GET', key))

    if value <= oldValue then
      return false
    end
  end

  redis.call('SET', key, value)

  return true
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

	constructor(config: Omit<KvConfigRedis, 'type'> & { ttl?: number }) {
		if ('setMax' in config.redis === false) {
			config.redis.defineCommand('setMax', {
				numberOfKeys: 1,
				lua: SET_MAX_SCRIPT,
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

		this.redlock = new Redlock([this.redis], {
			retryDelay: 50,
			driftFactor: 0.01,
			retryCount: 100,
			retryJitter: 20,
		});

		this.ttl = config.ttl;
	}

	async get<T = unknown>(key: string) {
		const value = await this.redis.getBuffer(withNamespace(key, this.namespace));

		if (value === null) {
			return undefined;
		}

		let binaryArray = bufferToUint8Array(value);

		if (this.compression === true && isCompressed(binaryArray)) {
			binaryArray = await decompress(binaryArray);
		}

		return <T>deserialize(binaryArray);
	}

	async set<T = unknown>(key: string, value: T) {
		if (typeof value === 'number') {
			if (this.ttl) {
				await this.redis.set(withNamespace(key, this.namespace), value, 'PX', this.ttl);
			} else {
				await this.redis.set(withNamespace(key, this.namespace), value);
			}
		} else {
			let binaryArray = serialize(value);

			if (this.compression === true && binaryArray.byteLength >= this.compressionMinSize) {
				binaryArray = await compress(binaryArray);
			}

			if (this.ttl) {
				await this.redis.set(withNamespace(key, this.namespace), uint8ArrayToBuffer(binaryArray), 'PX', this.ttl);
			} else {
				await this.redis.set(withNamespace(key, this.namespace), uint8ArrayToBuffer(binaryArray));
			}
		}
	}

	async delete(key: string) {
		await this.redis.unlink(withNamespace(key, this.namespace));
	}

	async has(key: string) {
		const exists = await this.redis.exists(withNamespace(key, this.namespace));
		return exists !== 0;
	}

	async increment(key: string, amount = 1) {
		return await this.redis.incrby(withNamespace(key, this.namespace), amount);
	}

	async setMax(key: string, value: number) {
		const wasSet = await this.redis.setMax(withNamespace(key, this.namespace), value);
		return wasSet !== 0;
	}

	async acquireLock(key: string) {
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

	async clear() {
		const keysStream = this.redis.scanStream({
			match: withNamespace('*', this.namespace),
		});

		const pipeline = this.redis.pipeline();

		for await (const keys of keysStream) {
			pipeline.unlink(keys);
		}

		await pipeline.exec();
	}
}
