import type { Redis } from 'ioredis';
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
import type { KvConfigRedis } from '../index.js';
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

export class KvRedis implements Kv {
	private redis: Redis;
	private namespace: string;
	private compression: boolean;
	private compressionMinSize: number;

	constructor(config: Omit<KvConfigRedis, 'type'>) {
		this.redis = config.redis;
		this.namespace = config.namespace;
		this.compression = config.compression ?? true;
		this.compressionMinSize = config.compressionMinSize ?? 1000;

		this.redis.defineCommand('setMax', {
			numberOfKeys: 1,
			lua: SET_MAX_SCRIPT,
		});
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
			await this.redis.set(withNamespace(key, this.namespace), value);
		} else {
			let binaryArray = serialize(value);

			if (this.compression === true && binaryArray.byteLength >= this.compressionMinSize) {
				binaryArray = await compress(binaryArray);
			}

			await this.redis.set(withNamespace(key, this.namespace), uint8ArrayToBuffer(binaryArray));
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
		const client = this.redis as Redis & { setMax(key: string, value: number): Promise<number> };
		const wasSet = await client.setMax(withNamespace(key, this.namespace), value);
		return wasSet !== 0;
	}
}
