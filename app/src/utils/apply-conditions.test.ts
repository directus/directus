import { VERSION_KEY_DRAFT } from '@directus/constants';
import type { Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentVersionMaybeNew } from '@/types/versions';
import { applyConditions } from '@/utils/apply-conditions';

function makeField(rule: Record<string, unknown>): Field {
	return {
		collection: 'test',
		field: 'title',
		name: 'title',
		type: 'string',
		schema: null,
		meta: {
			id: 1,
			collection: 'test',
			field: 'title',
			special: null,
			interface: 'input',
			options: null,
			display: null,
			display_options: null,
			readonly: false,
			hidden: false,
			sort: 1,
			width: 'full',
			translations: null,
			note: null,
			conditions: [{ name: 'locked', rule, readonly: true }],
			required: false,
			group: null,
			validation: null,
			validation_message: null,
		},
	} as Field;
}

const persistedDraft: ContentVersionMaybeNew = {
	id: 'draft-id',
	key: VERSION_KEY_DRAFT,
	name: null,
	collection: 'test',
	item: '1',
	hash: 'hash',
	date_created: '2024-01-01',
	date_updated: null,
	user_created: 'user-1',
	user_updated: null,
	delta: {},
	type: 'global',
};

const namedVersion: ContentVersionMaybeNew = {
	...persistedDraft,
	id: 'named-id',
	key: 'my-version',
	name: 'My Version',
	type: 'local',
};

describe('applyConditions with a $version rule', () => {
	beforeEach(() => {
		setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
	});

	it('matches the draft version by its key, although a draft has no name', () => {
		const field = makeField({ $version: { _eq: VERSION_KEY_DRAFT } });

		expect(applyConditions({}, field, persistedDraft).meta?.readonly).toBe(true);
	});

	it('matches a named version by its key rather than its display name', () => {
		const field = makeField({ $version: { _eq: 'my-version' } });

		expect(applyConditions({}, field, namedVersion).meta?.readonly).toBe(true);
	});

	it('does not match a version whose key differs from the rule', () => {
		const field = makeField({ $version: { _eq: 'my-version' } });

		expect(applyConditions({}, field, persistedDraft).meta?.readonly).toBe(false);
	});

	it('treats the published version as no version', () => {
		const field = makeField({ $version: { _null: true } });

		expect(applyConditions({}, field, null).meta?.readonly).toBe(true);
		expect(applyConditions({}, field, persistedDraft).meta?.readonly).toBe(false);
	});
});
