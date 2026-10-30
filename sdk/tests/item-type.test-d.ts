import { describe, expectTypeOf, test } from 'vitest';
import type { ApplyQueryFields, DirectusUser, ItemType } from '../src/index.js';

describe('ItemType', () => {
	test('includes core collection item types even when absent from the schema (issue #21250)', () => {
		// `assignee_id` is a required field DirectusUser doesn't have, so DirectusUser<Schema>
		// can't accidentally structurally match this collection's item type.
		type Schema = { festivities: { id: string; assignee_id: string }[] };

		type Match = Extract<DirectusUser<Schema>, ItemType<Schema>>;

		expectTypeOf<Match>().toEqualTypeOf<DirectusUser<Schema>>();
	});
});

describe('Deep query on a custom field typed with a core collection generic (issue #21250)', () => {
	test('a field typed `string | DirectusUser<Schema> | null` resolves the requested nested fields', () => {
		type CalendarEvents = {
			id: string;
			title: string;
		};

		type Festivities = {
			id: string;
			assignee?: string | DirectusUser<Schema> | null;
			calendar_events: CalendarEvents[];
		};

		type Schema = {
			festivities: Festivities[];
			calendar_events: CalendarEvents[];
		};

		const _fields = ['id', { assignee: ['id', 'email'], calendar_events: ['id', 'title'] }] as const;

		type Result = ApplyQueryFields<Schema, Festivities, typeof _fields>;

		expectTypeOf<Result['assignee']>().toEqualTypeOf<Pick<DirectusUser<Schema>, 'id' | 'email'> | null>();
	});
});
