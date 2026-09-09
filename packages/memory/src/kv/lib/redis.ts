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

const EPOCH_KEY = '__epoch';
const GENERATION_PREFIX = 'v';

/** ARGV: 1 prefix, 2 key */
const GET_SCRIPT = `
	local epoch = redis.call('GET', KEYS[1])

	if epoch == false then
		return false
	end

	return redis.call('GET', ARGV[1] .. epoch .. ':' .. ARGV[2])
`;

/** ARGV: 1 prefix, 2 key */
const EXISTS_SCRIPT = `
	local epoch = redis.call('GET', KEYS[1])

	if epoch == false then
		return 0
	end

	return redis.call('EXISTS', ARGV[1] .. epoch .. ':' .. ARGV[2])
`;

/** ARGV: 1 prefix, 2 key */
const DELETE_SCRIPT = `
	local epoch = redis.call('GET', KEYS[1])

	if epoch == false then
		return 0
	end

	return redis.call('UNLINK', ARGV[1] .. epoch .. ':' .. ARGV[2])
`;

/** ARGV: 1 seed, 2 prefix, 3 key, 4 value, 5 ttl in ms (0 to persist) */
const SET_SCRIPT = `
	local epoch = redis.call('GET', KEYS[1])

	if epoch == false then
		epoch = ARGV[1]
		redis.call('SET', KEYS[1], epoch)
	end

	local key = ARGV[2] .. epoch .. ':' .. ARGV[3]
	local ttl = tonumber(ARGV[5])

	if ttl > 0 then
		return redis.call('SET', key, ARGV[4], 'PX', ttl)
	end

	return redis.call('SET', key, ARGV[4])
`;

/** ARGV: 1 seed, 2 prefix, 3 key, 4 amount */
const INCREMENT_SCRIPT = `
	local epoch = redis.call('GET', KEYS[1])

	if epoch == false then
		epoch = ARGV[1]
		redis.call('SET', KEYS[1], epoch)
	end

	return redis.call('INCRBY', ARGV[2] .. epoch .. ':' .. ARGV[3], ARGV[4])
`;

/** KEYS: 1 key. ARGV: 1 value */
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

/** ARGV: 1 seed, 2 prefix, 3 key, 4 value */
const EPOCH_SET_MAX_SCRIPT = `
	local epoch = redis.call('GET', KEYS[1])

	if epoch == false then
		epoch = ARGV[1]
		redis.call('SET', KEYS[1], epoch)
	end

	local key = ARGV[2] .. epoch .. ':' .. ARGV[3]
	local value = tonumber(ARGV[4])

	if redis.call('EXISTS', key) == 1 then
		local oldValue = tonumber(redis.call('GET', key))

		if value <= oldValue then
			return 0
		end
	end

	redis.call('SET', key, ARGV[4])

	return 1
`;

/** ARGV: 1 seed */
const BUMP_EPOCH_SCRIPT = `
	local seed = tonumber(ARGV[1])
	local current = tonumber(redis.call('GET', KEYS[1]))
	local bumped = seed

	if current ~= nil and current + 1 > bumped then
		bumped = current + 1
	end

	local epoch = string.format('%d', bumped)

	redis.call('SET', KEYS[1], epoch)

	return epoch
`;

const RELEASE_SCRIPT = `
	if redis.call("GET", KEYS[1]) == ARGV[1] then
	return redis.call("DEL", KEYS[1])
	else
	return 0
	end
`;

/** Defined for every instance */
export const SCRIPTS: Record<string, string> = {
	setMax: SET_MAX_SCRIPT,
	release: RELEASE_SCRIPT,
};

/** Only when epoch enabled */
export const EPOCH_SCRIPTS: Record<string, string> = {
	kvGet: GET_SCRIPT,
	kvExists: EXISTS_SCRIPT,
	kvDelete: DELETE_SCRIPT,
	kvSet: SET_SCRIPT,
	kvIncrement: INCREMENT_SCRIPT,
	kvSetMax: EPOCH_SET_MAX_SCRIPT,
	kvBumpEpoch: BUMP_EPOCH_SCRIPT,
};

export class KvRedis implements Kv {
	private redis: ExtendedRedis;
	private namespace: string;
	private compression: boolean;
	private compressionMinSize: number;
	private lockTimeout: number;
	private redlock;
	private ttl: number | undefined;
	private epoch: boolean;
	private epochKey: string;
	private keyPrefix: string;

	constructor(config: Omit<KvConfigRedis, 'type'>) {
		this.epoch = config.epoch ?? false;

		const scripts = this.epoch ? { ...SCRIPTS, ...EPOCH_SCRIPTS } : SCRIPTS;

		for (const [name, lua] of Object.entries(scripts)) {
			if (name in config.redis === false) {
				config.redis.defineCommand(name, { numberOfKeys: 1, lua });
			}
		}

		this.redis = config.redis as ExtendedRedis;
		this.namespace = config.namespace;
		this.compression = config.compression ?? true;
		this.compressionMinSize = config.compressionMinSize ?? 1000;
		this.lockTimeout = config.lockTimeout ?? 5000;
		this.epochKey = withNamespace(EPOCH_KEY, this.namespace);
		this.keyPrefix = withNamespace(GENERATION_PREFIX, this.namespace);

		this.redlock = new Redlock([this.redis], {
			retryDelay: 50,
			driftFactor: 0.01,
			retryCount: 100,
			retryJitter: 20,
		});

		this.ttl = config.ttl;
	}

	async get<T = unknown>(key: string): Promise<T | undefined> {
		const value = this.epoch
			? await this.redis.kvGetBuffer(this.epochKey, this.keyPrefix, key)
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
		let payload: Buffer<ArrayBuffer> | number;

		if (typeof value === 'number') {
			payload = value;
		} else {
			let binaryArray = serialize(value);

			if (this.compression === true && binaryArray.byteLength >= this.compressionMinSize) {
				binaryArray = await compress(binaryArray);
			}

			payload = uint8ArrayToBuffer(binaryArray);
		}

		if (this.epoch) {
			await this.redis.kvSet(this.epochKey, Date.now(), this.keyPrefix, key, payload, this.ttl ?? 0);
			return;
		}

		const namespaced = withNamespace(key, this.namespace);

		if (this.ttl) {
			await this.redis.set(namespaced, payload, 'PX', this.ttl);
		} else {
			await this.redis.set(namespaced, payload);
		}
	}

	async delete(key: string): Promise<void> {
		if (this.epoch) {
			await this.redis.kvDelete(this.epochKey, this.keyPrefix, key);
		} else {
			await this.redis.unlink(withNamespace(key, this.namespace));
		}
	}

	async has(key: string): Promise<boolean> {
		const exists = this.epoch
			? await this.redis.kvExists(this.epochKey, this.keyPrefix, key)
			: await this.redis.exists(withNamespace(key, this.namespace));

		return exists !== 0;
	}

	async increment(key: string, amount = 1): Promise<number> {
		if (this.epoch) {
			return await this.redis.kvIncrement(this.epochKey, Date.now(), this.keyPrefix, key, amount);
		}

		return await this.redis.incrby(withNamespace(key, this.namespace), amount);
	}

	async setMax(key: string, value: number): Promise<boolean> {
		const wasSet = this.epoch
			? await this.redis.kvSetMax(this.epochKey, Date.now(), this.keyPrefix, key, value)
			: await this.redis.setMax(withNamespace(key, this.namespace), value);

		return wasSet !== 0;
	}

	/**
	 * Locks are not affected by epoch
	 */
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
		if (this.epoch) {
			await this.redis.kvBumpEpoch(this.epochKey, Date.now());
			return;
		}

		const keysStream = this.redis.scanStream({
			match: withNamespace('*', this.namespace),
			count: 10000,
		});

		const pipeline = this.redis.pipeline();

		for await (const keys of keysStream) {
			pipeline.unlink(keys);
		}

		await pipeline.exec();
	}
}
