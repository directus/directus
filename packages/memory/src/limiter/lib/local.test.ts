import { LimiterLocal } from './local.js';
import { consume } from '../utils/consume.js';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('rate-limiter-flexible');
vi.mock('../utils/consume.js');

let limiter: LimiterLocal;
let points: number;
let duration: number;
let key: string;

beforeEach(() => {
	points = 5;
	duration = 10;
	key = 'rate-limiter-key';
	limiter = new LimiterLocal({ points, duration });
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('constructor', () => {
	test('Creates rate-limiter with correct config', () => {
		expect(limiter['limiter']).toBeInstanceOf(RateLimiterMemory);
		expect(RateLimiterMemory).toHaveBeenCalledWith({ points, duration });
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
