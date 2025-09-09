import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { ContentVersion } from '@directus/types';
import { Revision } from '@/types/revisions';

// Mock the API
vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

// Mock unexpectedError
vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

import { normalizeComparisonData } from './normalize-comparison-data';
import api from '@/api';

describe('normalizeComparisonData', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should fetch comparison data when version is not in composable', async () => {
		const mockComparisonData = {
			outdated: false,
			mainHash: 'abc123',
			current: { title: 'Version Title', content: 'Version Content' },
			main: { title: 'Main Title', content: 'Main Content' },
		};

		vi.mocked(api.get).mockResolvedValue({
			data: { data: mockComparisonData },
		});

		const result = await normalizeComparisonData('version-123', 'version');

		expect(api.get).toHaveBeenCalledWith('/versions/version-123/compare');

		expect(result).toEqual({
			base: mockComparisonData.main,
			delta: { ...mockComparisonData.main, ...mockComparisonData.current },
			outdated: false,
			mainHash: 'abc123',
		});
	});

	it('should use version from currentVersion when available', async () => {
		const mockVersion: ContentVersion = {
			id: 'version-123',
			key: 'v1',
			name: 'Version 1',
			collection: 'articles',
			item: 'article-1',
			hash: 'hash123',
			delta: { title: 'Version Title' },
			date_created: '2024-01-01T00:00:00Z',
			date_updated: '2024-01-01T00:00:00Z',
			user_created: 'user-1',
			user_updated: 'user-1',
		};

		const currentVersion = ref(mockVersion);
		const versions = ref([mockVersion]);

		const mockComparisonData = {
			outdated: true,
			mainHash: 'def456',
			current: { title: 'Updated Title' },
			main: { title: 'Original Title' },
		};

		vi.mocked(api.get).mockResolvedValue({
			data: { data: mockComparisonData },
		});

		const result = await normalizeComparisonData('version-123', 'version', currentVersion, versions);

		expect(api.get).toHaveBeenCalledWith('/versions/version-123/compare');

		expect(result).toEqual({
			base: mockComparisonData.main,
			delta: { ...mockComparisonData.main, ...mockComparisonData.current },
			outdated: true,
			mainHash: 'def456',
		});
	});

	it('should find version in versions array when not in currentVersion', async () => {
		const mockVersion: ContentVersion = {
			id: 'version-456',
			key: 'v2',
			name: 'Version 2',
			collection: 'articles',
			item: 'article-1',
			hash: 'hash456',
			delta: { content: 'New Content' },
			date_created: '2024-01-02T00:00:00Z',
			date_updated: '2024-01-02T00:00:00Z',
			user_created: 'user-1',
			user_updated: 'user-1',
		};

		const currentVersion = ref(null);
		const versions = ref([mockVersion]);

		const mockComparisonData = {
			outdated: false,
			mainHash: 'ghi789',
			current: { content: 'New Content' },
			main: { content: 'Old Content' },
		};

		vi.mocked(api.get).mockResolvedValue({
			data: { data: mockComparisonData },
		});

		const result = await normalizeComparisonData('version-456', 'version', currentVersion, versions);

		expect(api.get).toHaveBeenCalledWith('/versions/version-456/compare');

		expect(result).toEqual({
			base: mockComparisonData.main,
			delta: { ...mockComparisonData.main, ...mockComparisonData.current },
			outdated: false,
			mainHash: 'ghi789',
		});
	});

	it('should handle revision comparison when revision is in composable', async () => {
		const mockRevision: Revision = {
			id: 123,
			collection: 'articles',
			item: 'article-1',
			data: { title: 'Updated Title', content: 'Updated Content' },
			delta: { title: 'Updated Title' },
			activity: {
				action: 'update',
				ip: '127.0.0.1',
				user_agent: 'Mozilla/5.0',
				origin: 'http://localhost',
				timestamp: '2024-01-01T00:00:00Z',
				user: { id: 'user-1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
			},
			timestampFormatted: 'Jan 1, 2024 (12:00 AM)',
			timeRelative: '12:00 AM (2 hours ago)',
			status: 'resolve',
		};

		const revisions = ref([mockRevision]);

		const result = await normalizeComparisonData('123', 'revision', undefined, undefined, revisions);

		expect(result).toEqual({
			base: { title: null, content: 'Updated Content' }, // title was changed, so base is null
			delta: { title: 'Updated Title', content: 'Updated Content' }, // complete item after revision
		});
	});

	it('should fetch revision comparison when revision is not in composable', async () => {
		const mockRevisionData = {
			id: 456,
			collection: 'articles',
			item: 'article-1',
			data: { title: 'New Title', content: 'New Content' },
			delta: { title: 'New Title', content: 'New Content' },
			activity: {
				action: 'create',
				timestamp: '2024-01-01T00:00:00Z',
				user: { id: 'user-1', email: 'user@example.com', first_name: 'John', last_name: 'Doe' },
			},
		};

		vi.mocked(api.get).mockResolvedValue({
			data: { data: mockRevisionData },
		});

		const result = await normalizeComparisonData('456', 'revision');

		expect(api.get).toHaveBeenCalledWith('/revisions/456', {
			params: {
				fields: ['id', 'data', 'delta', 'collection', 'item', 'activity.action', 'activity.timestamp', 'activity.user'],
			},
		});

		expect(result).toEqual({
			base: { title: null, content: null }, // both fields were changed
			delta: { title: 'New Title', content: 'New Content' }, // complete item after revision
		});
	});
});
