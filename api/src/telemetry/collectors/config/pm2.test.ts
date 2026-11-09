import { describe, expect, test } from 'vitest';
import { collectPm2 } from './pm2.js';

describe('collectPm2', () => {
	test('defaults to 1 instance when PM2_INSTANCES not set', () => {
		expect(collectPm2({})).toEqual({ instances: 1 });
	});

	test('returns parsed number of instances', () => {
		expect(collectPm2({ PM2_INSTANCES: '4' })).toEqual({ instances: 4 });
	});

	test('defaults to 1 for non-numeric value', () => {
		expect(collectPm2({ PM2_INSTANCES: 'abc' })).toEqual({ instances: 1 });
	});
});
