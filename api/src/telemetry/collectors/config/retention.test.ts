import { describe, expect, test } from 'vitest';
import { collectRetention } from './retention.js';

const defaults = {
	RETENTION_ENABLED: false,
	ACTIVITY_RETENTION: '90d',
	REVISIONS_RETENTION: '90d',
	FLOW_LOGS_RETENTION: '90d',
};

describe('collectRetention', () => {
	test('returns defaults when no env is set', () => {
		expect(collectRetention({ ...defaults })).toEqual({
			enabled: false,
			activity: '90d',
			revisions: '90d',
			flow_logs: '90d',
		});
	});

	test('returns configured values', () => {
		expect(
			collectRetention({
				...defaults,
				RETENTION_ENABLED: true,
				ACTIVITY_RETENTION: '15d',
				REVISIONS_RETENTION: '30d',
				FLOW_LOGS_RETENTION: '7d',
			}),
		).toEqual({
			enabled: true,
			activity: '15d',
			revisions: '30d',
			flow_logs: '7d',
		});
	});
});
