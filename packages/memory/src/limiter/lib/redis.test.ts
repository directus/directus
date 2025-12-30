import { LimiterRedis } from './redis.js';
import { consume } from '../utils/consume.js';
import { Redis } from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('ioredis');
vi.mock('rate-limiter-flexible');
vi.mock('../utils/consume.js');

let redis: Redis;
let namespace: string;
let limiter: LimiterRedis;
let points: number;
let duration: number;
let key: string;

beforeEach(() => {
	redis = new Redis();
	namespace = 'rate-limiter-namespace';
	points = 5;
	duration = 10;
	key = 'rate-limiter-key';
	limiter = new LimiterRedis({ redis, namespace, points, duration });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Creates rate-limiter with correct config', () => {
		expect(limiter['limiter']).toBeInstanceOf(RateLimiterRedis);
		expect(RateLimiterRedis).toHaveBeenCalledWith({ storeClient: redis, keyPrefix: namespace, points, duration });
	});
});

describe('consume', () => {
	test('Calls consume with current limiter instance', async () => {
		await limiter.consume(key);
		expect(consume).toHaveBeenCalledWith(limiter['limiter'], key, limiter['points']);
	});
});

describe('delete', () => {
	test('Calls limiter delete', async () => {
		await limiter.delete(key);
		expect(limiter['limiter'].delete).toHaveBeenCalledWith(key);
	});
});
