import { describe, expect, test } from 'vitest';
import { mergeResolvedItems, removeResolvedEntries } from './merge.js';

const JAN = '2026-01-01T00:00:00.000Z';
const FEB = '2026-02-01T00:00:00.000Z';

describe('mergeResolvedItems', () => {
	test('merges new ids per key with resolved_at = now', () => {
		expect(mergeResolvedItems({}, { collections: ['c1'], sso_users: ['s1'] }, JAN)).toEqual({
			collections: [{ id: 'c1', resolved_at: JAN }],
			sso_users: [{ id: 's1', resolved_at: JAN }],
		});
	});

	test('de-duplicates by id, keeping the newest resolved_at', () => {
		const result = mergeResolvedItems({ flows: [{ id: 'a', resolved_at: JAN }] }, { flows: ['a'] }, FEB);

		expect(result).toEqual({ flows: [{ id: 'a', resolved_at: FEB }] });
	});

	test('keeps keys that are not in the added input', () => {
		const result = mergeResolvedItems({ seats: [{ id: 'u1', resolved_at: JAN }] }, { flows: ['f1'] }, FEB);

		expect(result).toEqual({
			seats: [{ id: 'u1', resolved_at: JAN }],
			flows: [{ id: 'f1', resolved_at: FEB }],
		});
	});

	test('ignores empty id lists', () => {
		expect(mergeResolvedItems(null, { collections: [] }, JAN)).toEqual({});
	});

	test('treats null current as empty', () => {
		expect(mergeResolvedItems(null, { seats: ['u1'] }, JAN)).toEqual({ seats: [{ id: 'u1', resolved_at: JAN }] });
	});
});

describe('removeResolvedEntries', () => {
	test('removes only the given entries', () => {
		const current = {
			flows: [
				{ id: 'f1', resolved_at: JAN },
				{ id: 'f2', resolved_at: JAN },
			],
		};

		expect(removeResolvedEntries(current, { flows: [{ id: 'f1', resolved_at: JAN }] })).toEqual({
			flows: [{ id: 'f2', resolved_at: JAN }],
		});
	});

	test('keeps entries recorded again since the snapshot', () => {
		const current = { flows: [{ id: 'f1', resolved_at: FEB }] };

		expect(removeResolvedEntries(current, { flows: [{ id: 'f1', resolved_at: JAN }] })).toEqual(current);
	});

	test('drops keys that become empty', () => {
		const current = { flows: [{ id: 'f', resolved_at: JAN }] };

		expect(removeResolvedEntries(current, current)).toEqual({});
	});

	test('treats null current as empty', () => {
		expect(removeResolvedEntries(null, { flows: [{ id: 'f', resolved_at: JAN }] })).toEqual({});
	});
});
