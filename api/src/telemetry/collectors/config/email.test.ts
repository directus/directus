import { describe, expect, test } from 'vitest';
import { collectEmail } from './email.js';

const defaults = {
	EMAIL_TRANSPORT: 'sendmail',
};

describe('collectEmail', () => {
	test('returns sendmail transport by default', () => {
		expect(collectEmail({ ...defaults })).toEqual({ transport: 'sendmail' });
	});

	test('returns configured transport', () => {
		expect(collectEmail({ ...defaults, EMAIL_TRANSPORT: 'smtp' })).toEqual({ transport: 'smtp' });
	});
});
