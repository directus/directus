import { expect, test, vi } from 'vitest';
import { messageConstructor } from './hit-rate-limit.js';

vi.useFakeTimers();

vi.setSystemTime('2023-05-31T14:45:00Z');

test('Constructs message', () => {
	expect(
		messageConstructor({
			limit: 100,
			reset: new Date('2023-05-31T14:45:30Z'),
		}),
	).toMatchInlineSnapshot('"Too many requests, retry after 30s."');
});
