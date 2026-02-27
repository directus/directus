import { describe, expect, test } from 'vitest';
import { collectRetention } from './retention.js';

describe('collectRetention', () => {
	test('returns defaults when no env is set', () => {
		expect(collectRetention({})).toEqual({
			enabled: false,
			activity: null,
			revisions: null,
			flow_logs: null,
		});
	});

	test('returns configured values', () => {
		expect(collectRetention({
			RETENTION_ENABLED: true,
			ACTIVITY_RETENTION: '15d',
			REVISIONS_RETENTION: '30d',
			FLOW_LOGS_RETENTION: '7d',
		})).toEqual({
			enabled: true,
			activity: '15d',
			revisions: '30d',
			flow_logs: '7d',
		});
	});
});
