import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createMutationTracker } from './create-mutation-tracker.js';

vi.mock('@directus/env');

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({ MAX_BATCH_MUTATION: 10 });
});

afterEach(() => {
	vi.clearAllMocks();
});

test('starts at a count of 0 by default', () => {
	const tracker = createMutationTracker();

	expect(tracker.getCount()).toBe(0);
});

test('starts at the provided initial count', () => {
	const tracker = createMutationTracker(5);

	expect(tracker.getCount()).toBe(5);
});

test('accumulates tracked mutations', () => {
	const tracker = createMutationTracker();

	tracker.trackMutations(2);
	tracker.trackMutations(3);

	expect(tracker.getCount()).toBe(5);
});

test('adds tracked mutations to the initial count', () => {
	const tracker = createMutationTracker(4);

	tracker.trackMutations(3);

	expect(tracker.getCount()).toBe(7);
});

test('does not throw when the count is exactly at the limit', () => {
	const tracker = createMutationTracker();

	expect(() => tracker.trackMutations(10)).not.toThrow();
	expect(tracker.getCount()).toBe(10);
});

test('throws when the count exceeds the limit', () => {
	const tracker = createMutationTracker();

	expect(() => tracker.trackMutations(11)).toThrowError(InvalidPayloadError);
});

test('throws when accumulated mutations exceed the limit', () => {
	const tracker = createMutationTracker();

	tracker.trackMutations(6);

	expect(() => tracker.trackMutations(5)).toThrowError(InvalidPayloadError);
});

test('throws when the initial count plus tracked mutations exceed the limit', () => {
	const tracker = createMutationTracker(8);

	expect(() => tracker.trackMutations(3)).toThrowError(InvalidPayloadError);
});

test('includes the configured limit in the error message', () => {
	const tracker = createMutationTracker();

	expect(() => tracker.trackMutations(11)).toThrowError('Exceeded max batch mutation limit of 10');
});
