import { VERSION_KEY_DRAFT, VERSION_KEY_PUBLISHED } from '@directus/constants';
import { describe, expect, test } from 'vitest';
import type { ContentVersionMaybeNew, NewContentVersion } from '@/types/versions';
import { getPreviewVersionKey } from '@/utils/get-preview-version-key';

describe('getPreviewVersionKey', () => {
	test('resolves to the published key when no version is selected', () => {
		expect(getPreviewVersionKey(null)).toBe(VERSION_KEY_PUBLISHED);
	});

	test('resolves to the published key when the selected version is not persisted yet', () => {
		const unsavedDraft: NewContentVersion = {
			id: '+',
			key: VERSION_KEY_DRAFT,
			name: null,
			type: 'global',
		};

		expect(getPreviewVersionKey(unsavedDraft)).toBe(VERSION_KEY_PUBLISHED);
	});

	test('resolves to the version key once the selected version is persisted', () => {
		const persistedDraft: ContentVersionMaybeNew = {
			id: 'existing-draft-id',
			key: VERSION_KEY_DRAFT,
			name: null,
			collection: 'test_collection',
			item: '1',
			hash: 'abc123',
			date_created: '2024-01-01',
			date_updated: null,
			user_created: 'user-1',
			user_updated: null,
			delta: {},
			type: 'global',
		};

		expect(getPreviewVersionKey(persistedDraft)).toBe(VERSION_KEY_DRAFT);
	});

	test('resolves to the version key for a persisted named version', () => {
		const namedVersion: ContentVersionMaybeNew = {
			id: 'existing-version-id',
			key: 'my-version',
			name: 'My Version',
			collection: 'test_collection',
			item: '1',
			hash: 'abc123',
			date_created: '2024-01-01',
			date_updated: null,
			user_created: 'user-1',
			user_updated: null,
			delta: {},
			type: 'local',
		};

		expect(getPreviewVersionKey(namedVersion)).toBe('my-version');
	});
});
