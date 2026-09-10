import { Redis } from 'ioredis';
import { afterAll, beforeAll, describe, expect, inject, test } from 'vitest';
import { KvRedis } from '../src/kv/lib/redis.js';

/**
 * Exercises `KvRedis` against the Redis instance spun up by `test/global-setup.ts`, as the unit
 * tests can only assert which commands are handed to ioredis, not that the resulting layout,
 * expiry and locking behave the way they're expected to
 */

let redis: Redis;
let namespaceCount = 0;

/** Each test gets its own namespace so nothing has to be flushed between them */
const uniqueNamespace = () => `kv-test-${process.pid}-${namespaceCount++}`;

const createKv = (config: { namespace: string; hash: boolean; ttl?: number; compressionMinSize?: number }) =>
	new KvRedis({ redis, compression: true, ...config });

beforeAll(async () => {
	redis = new Redis({ host: '127.0.0.1', port: inject('redisPort') });
	await redis.ping();
});

afterAll(async () => {
	await redis.quit();
});

test('Runs against the expected Redis', async () => {
	const info = await redis.info('server');
	expect(info).toMatch(/redis_version:/);
});

describe.each([
	{ label: 'namespaced keys', hash: false },
	{ label: 'namespace hash', hash: true },
])('$label', ({ hash }) => {
	describe('get / set', () => {
		test.each([
			{ label: 'object', value: { a: 1, b: 'two', c: [3, null] } },
			{ label: 'array', value: [1, 'two', { three: true }] },
			{ label: 'string', value: 'hello' },
			{ label: 'number', value: 42 },
			{ label: 'negative number', value: -7.5 },
			{ label: 'boolean', value: true },
			{ label: 'null', value: null },
			{ label: 'empty object', value: {} },
		])('Round-trips a $label', async ({ value }) => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await kv.set('key', value);

			expect(await kv.get('key')).toStrictEqual(value);
		});

		test('Returns undefined for a key that was never set', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			expect(await kv.get('missing')).toBe(undefined);
		});

		test('Overwrites an existing value', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await kv.set('key', 'first');
			await kv.set('key', 'second');

			expect(await kv.get('key')).toBe('second');
		});

		test('Round-trips a value large enough to be compressed', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash, compressionMinSize: 100 });
			const value = { blob: 'a'.repeat(5000) };

			await kv.set('key', value);

			expect(await kv.get('key')).toStrictEqual(value);
		});

		test('Actually gzips values over the compression threshold', async () => {
			const namespace = uniqueNamespace();
			const kv = createKv({ namespace, hash, compressionMinSize: 100 });

			await kv.set('big', { blob: 'a'.repeat(5000) });
			await kv.set('small', { blob: 'a' });

			const big = hash ? await redis.hgetBuffer(namespace, 'big') : await redis.getBuffer(`${namespace}:big`);
			const small = hash ? await redis.hgetBuffer(namespace, 'small') : await redis.getBuffer(`${namespace}:small`);

			// Gzip magic number
			expect(big?.subarray(0, 3)).toStrictEqual(Buffer.from([0x1f, 0x8b, 0x08]));
			expect(small?.subarray(0, 3)).not.toStrictEqual(Buffer.from([0x1f, 0x8b, 0x08]));
		});

		test('Is visible to a second instance on the same namespace', async () => {
			const namespace = uniqueNamespace();
			const writer = createKv({ namespace, hash });
			const reader = createKv({ namespace, hash });

			await writer.set('key', { shared: true });

			expect(await reader.get('key')).toStrictEqual({ shared: true });
		});

		test('Is isolated from another namespace', async () => {
			const other = createKv({ namespace: uniqueNamespace(), hash });
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await kv.set('key', 'mine');

			expect(await other.get('key')).toBe(undefined);
		});
	});

	describe('has / delete', () => {
		test('Reports whether a key exists', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			expect(await kv.has('key')).toBe(false);

			await kv.set('key', 'value');
			expect(await kv.has('key')).toBe(true);

			await kv.delete('key');
			expect(await kv.has('key')).toBe(false);
			expect(await kv.get('key')).toBe(undefined);
		});

		test('Deleting a missing key is a no-op', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await expect(kv.delete('missing')).resolves.not.toThrow();
		});

		test('Deleting one key leaves the others alone', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await kv.set('a', 1);
			await kv.set('b', 2);
			await kv.delete('a');

			expect(await kv.has('a')).toBe(false);
			expect(await kv.get('b')).toBe(2);
		});
	});

	describe('increment', () => {
		test('Counts up from zero', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			expect(await kv.increment('count')).toBe(1);
			expect(await kv.increment('count')).toBe(2);
			expect(await kv.increment('count', 5)).toBe(7);
			expect(await kv.increment('count', -3)).toBe(4);
		});

		test('Increments a value written through set, and stays readable through get', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await kv.set('count', 10);

			expect(await kv.increment('count')).toBe(11);
			expect(await kv.get('count')).toBe(11);
		});

		test('Stays consistent under concurrent increments', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await Promise.all(Array.from({ length: 50 }, () => kv.increment('count')));

			expect(await kv.get('count')).toBe(50);
		});
	});

	describe('setMax', () => {
		test('Writes when no value exists yet', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			expect(await kv.setMax('max', 10)).toBe(true);
			expect(await kv.get('max')).toBe(10);
		});

		test('Only writes strictly larger values', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await kv.setMax('max', 10);

			expect(await kv.setMax('max', 5)).toBe(false);
			expect(await kv.setMax('max', 10)).toBe(false);
			expect(await kv.get('max')).toBe(10);

			expect(await kv.setMax('max', 11)).toBe(true);
			expect(await kv.get('max')).toBe(11);
		});

		test('Settles on the highest value under concurrency', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await Promise.all([1, 9, 4, 7, 2].map((value) => kv.setMax('max', value)));

			expect(await kv.get('max')).toBe(9);
		});
	});

	describe('clear', () => {
		test('Removes every key in the namespace', async () => {
			const namespace = uniqueNamespace();
			const kv = createKv({ namespace, hash });

			await kv.set('a', 1);
			await kv.set('b', { two: true });
			await kv.increment('c');

			await kv.clear();

			expect(await kv.has('a')).toBe(false);
			expect(await kv.has('b')).toBe(false);
			expect(await kv.has('c')).toBe(false);
			expect(await redis.keys(`${namespace}*`)).toStrictEqual([]);
		});

		test('Leaves other namespaces untouched', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });
			const other = createKv({ namespace: uniqueNamespace(), hash });

			await kv.set('key', 'mine');
			await other.set('key', 'theirs');

			await kv.clear();

			expect(await other.get('key')).toBe('theirs');
		});

		test('Clearing an empty namespace is a no-op', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await expect(kv.clear()).resolves.not.toThrow();
		});
	});

	describe('locks', () => {
		test('Releases an acquired lock so it can be taken again', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			const lock = await kv.acquireLock('key');
			await lock.extend(5000);
			await lock.release();

			const second = await kv.acquireLock('key');
			await second.release();
		});

		test('Serializes callbacks contending for the same lock', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });
			const order: string[] = [];

			const critical = (name: string) =>
				kv.usingLock('key', async () => {
					order.push(`${name}:enter`);
					await new Promise((resolve) => setTimeout(resolve, 50));
					order.push(`${name}:exit`);
				});

			await Promise.all([critical('a'), critical('b')]);

			// Whichever won, neither entered while the other held the lock
			expect(order).toSatisfy(
				(entries: string[]) =>
					entries.join() === 'a:enter,a:exit,b:enter,b:exit' || entries.join() === 'b:enter,b:exit,a:enter,a:exit',
			);
		});

		test('Runs callbacks for different keys concurrently', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });
			let concurrent = 0;
			let peak = 0;

			const critical = (key: string) =>
				kv.usingLock(key, async () => {
					peak = Math.max(peak, ++concurrent);
					await new Promise((resolve) => setTimeout(resolve, 50));
					concurrent--;
				});

			await Promise.all([critical('a'), critical('b')]);

			expect(peak).toBe(2);
		});

		test('Propagates the error out of the callback and still releases', async () => {
			const kv = createKv({ namespace: uniqueNamespace(), hash });

			await expect(
				kv.usingLock('key', async () => {
					throw new Error('boom');
				}),
			).rejects.toThrow('boom');

			const lock = await kv.acquireLock('key');
			await lock.release();
		});
	});
});

describe('layout', () => {
	test('Namespaced keys are stored as individual string keys', async () => {
		const namespace = uniqueNamespace();
		const kv = createKv({ namespace, hash: false });

		await kv.set('a', 1);
		await kv.set('b', 2);

		expect((await redis.keys(`${namespace}*`)).sort()).toStrictEqual([`${namespace}:a`, `${namespace}:b`]);
		expect(await redis.type(`${namespace}:a`)).toBe('string');
	});

	test('The hash layout keeps every key in a single hash named after the namespace', async () => {
		const namespace = uniqueNamespace();
		const kv = createKv({ namespace, hash: true });

		await kv.set('a', 1);
		await kv.set('b', 2);

		expect(await redis.keys(`${namespace}*`)).toStrictEqual([namespace]);
		expect(await redis.type(namespace)).toBe('hash');
		expect((await redis.hkeys(namespace)).sort()).toStrictEqual(['a', 'b']);
	});

	test('Locks stay separate keys in the hash layout, as they can not live inside a hash', async () => {
		const namespace = uniqueNamespace();
		const kv = createKv({ namespace, hash: true });

		await kv.usingLock('mylock', async () => {
			expect(await redis.exists(`${namespace}:mylock`)).toBe(1);
			expect(await redis.type(`${namespace}:mylock`)).toBe('string');
		});
	});

	test('Each layout only sees its own entries', async () => {
		const namespace = uniqueNamespace();
		const keys = createKv({ namespace, hash: false });
		const hash = createKv({ namespace, hash: true });

		await keys.set('legacy', 'a');
		await hash.set('modern', 'b');

		expect(await hash.get('legacy')).toBe(undefined);
		expect(await keys.get('modern')).toBe(undefined);
	});

	test('Each layout only clears its own entries, so a flag flip strands the other', async () => {
		const namespace = uniqueNamespace();
		const keys = createKv({ namespace, hash: false });
		const hash = createKv({ namespace, hash: true });

		await keys.set('legacy', 'a');
		await hash.set('modern', 'b');

		await hash.clear();
		expect(await redis.exists(namespace)).toBe(0);
		expect(await redis.exists(`${namespace}:legacy`)).toBe(1);

		await hash.set('modern', 'b');
		await keys.clear();
		expect(await redis.exists(`${namespace}:legacy`)).toBe(0);
		expect(await redis.exists(namespace)).toBe(1);
	});
});

describe('ttl', () => {
	test('Expires an individual key in the namespaced key layout', async () => {
		const namespace = uniqueNamespace();
		const kv = createKv({ namespace, hash: false, ttl: 60_000 });

		await kv.set('key', 'value');

		const ttl = await redis.pttl(`${namespace}:key`);
		expect(ttl).toBeGreaterThan(55_000);
		expect(ttl).toBeLessThanOrEqual(60_000);
	});

	test('Expires the namespace as a whole in the hash layout', async () => {
		const namespace = uniqueNamespace();
		const kv = createKv({ namespace, hash: true, ttl: 60_000 });

		await kv.set('key', 'value');

		const ttl = await redis.pttl(namespace);
		expect(ttl).toBeGreaterThan(55_000);
		expect(ttl).toBeLessThanOrEqual(60_000);
	});

	test.each([
		{ label: 'set', act: (kv: KvRedis) => kv.set('key', 'refreshed') },
		{ label: 'increment', act: (kv: KvRedis) => kv.increment('counter') },
		{ label: 'setMax', act: (kv: KvRedis) => kv.setMax('max', 99) },
	])('Refreshes the namespace expiry on $label in the hash layout', async ({ act }) => {
		const namespace = uniqueNamespace();
		const kv = createKv({ namespace, hash: true, ttl: 60_000 });

		await kv.set('key', 'value');
		await redis.pexpire(namespace, 5_000);

		await act(kv);

		expect(await redis.pttl(namespace)).toBeGreaterThan(55_000);
	});

	test('Leaves the store persistent when no TTL is configured', async () => {
		const namespace = uniqueNamespace();
		const kv = createKv({ namespace, hash: true });

		await kv.set('key', 'value');

		// -1 is "no expiry", -2 is "no such key"
		expect(await redis.pttl(namespace)).toBe(-1);
	});

	test('Actually drops the value once the TTL elapses', async () => {
		const kv = createKv({ namespace: uniqueNamespace(), hash: true, ttl: 100 });

		await kv.set('key', 'value');
		expect(await kv.get('key')).toBe('value');

		await new Promise((resolve) => setTimeout(resolve, 300));

		expect(await kv.get('key')).toBe(undefined);
		expect(await kv.has('key')).toBe(false);
	});
});

describe('clear performance', () => {
	/** Keys outside the namespaces under test, so the scan of the keyspace has ground to cover */
	const DECOY_KEYS = 10_000;
	const decoyPrefix = 'kv-decoy';

	const eachDecoyBatch = async (queue: (pipeline: ReturnType<Redis['pipeline']>, key: string) => void) => {
		for (let batch = 0; batch * 1000 < DECOY_KEYS; batch++) {
			const pipeline = redis.pipeline();

			for (let i = 0; i < 1000; i++) {
				queue(pipeline, `${decoyPrefix}:${batch}-${i}`);
			}

			await pipeline.exec();
		}
	};

	beforeAll(async () => {
		await eachDecoyBatch((pipeline, key) => pipeline.set(key, '1'));
	});

	afterAll(async () => {
		await eachDecoyBatch((pipeline, key) => pipeline.unlink(key));
	});

	/** How many times Redis has run the given command so far, via `INFO commandstats` */
	const commandCalls = async (command: string) => {
		const stats = await redis.info('commandstats');
		const calls = stats.match(new RegExp(`^cmdstat_${command}:calls=(\\d+)`, 'm'));

		return calls ? Number(calls[1]) : 0;
	};

	/** Fills a namespace with `entries` keys, then reports what clearing it cost */
	const measureClear = async (hash: boolean, entries = 100) => {
		const kv = createKv({ namespace: uniqueNamespace(), hash });

		for (let i = 0; i < entries; i++) {
			await kv.set(`key-${i}`, { i });
		}

		const scansBefore = await commandCalls('scan');
		const start = performance.now();

		await kv.clear();

		const elapsed = performance.now() - start;

		return { elapsed, scans: (await commandCalls('scan')) - scansBefore };
	};

	test('The hash layout clears without walking the keyspace at all', async () => {
		const { scans } = await measureClear(true);

		expect(scans).toBe(0);
	});

	test('The namespaced key layout walks the whole keyspace to clear', async () => {
		const { scans } = await measureClear(false);

		// Scanned in pages, so the cost is set by the size of the keyspace rather than by the
		// handful of keys that are actually in the namespace
		expect(scans).toBeGreaterThan(100);
	});

	test('The namespaced key layout pays that cost even for an empty namespace', async () => {
		const { scans } = await measureClear(false, 0);

		expect(scans).toBeGreaterThan(100);
	});

	test('The hash layout clears at least an order of magnitude faster', async ({ annotate }) => {
		const keys = await measureClear(false);
		const hash = await measureClear(true);

		await annotate(
			`clear() over a ${DECOY_KEYS.toLocaleString()} key keyspace — ` +
				`namespaced keys: ${keys.elapsed.toFixed(1)}ms in ${keys.scans} scans, ` +
				`namespace hash: ${hash.elapsed.toFixed(1)}ms in ${hash.scans} scans`,
		);

		expect(hash.elapsed).toBeLessThan(keys.elapsed / 10);
	});
});
