import { randomUUID } from 'node:crypto';
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

let c = 0;

export class KvRedis implements Kv {
	private redis: ExtendedRedis;
	private namespace: string;
	private compression: boolean;
	private compressionMinSize: number;
	private lockTimeout: number;
	private releaseTimeout: number;

	constructor(config: Omit<KvConfigRedis, 'type'>) {
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
		this.lockTimeout = config.lockTimeout ?? 10;
		this.releaseTimeout = config.releaseTimeout ?? 5;
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
		const wasSet = await this.redis.setMax(withNamespace(key, this.namespace), value);
		return wasSet !== 0;
	}

	async aquireLock(key: string) {
		const i = c++;
		const hash = randomUUID();
		key = withNamespace(key, this.namespace);
		console.log(`${i} aquire lock with hash ${hash} `);

		let result = await this.redis.set(key, hash, 'EX', this.releaseTimeout, 'NX');

		await new Promise((resolve, reject) => {
			let rejected = false;

			const timeout = setTimeout(async () => {
				await this.redis.lrem(`${key}:queue`, 0, hash);
				rejected = true;
				reject(`Aquiring lock timed out after ${this.lockTimeout}s`);
			}, this.lockTimeout * 1000);

			(async () => {
				await this.redis.rpush(`${key}:queue`, hash);

				let tries = 0;

				while (result !== 'OK') {
					if (rejected) return;
					tries++;
					await sleep(Math.pow(2, tries));

					result = await this.redis.set(key, hash, 'EX', this.releaseTimeout, 'NX');
				}

				clearTimeout(timeout);
				resolve(undefined);
			})();
		});

		console.log(`${i} lock aquired`);

		return hash;
	}

	async releaseLock(key: string, hash: string) {
		const i = c++;
		key = withNamespace(key, this.namespace);
		console.log(`${i} release lock`);
		const result = await this.redis.release(key, hash);

		console.log(`${i} lock released ${result !== 0}`);

		return result !== 0;
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

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
