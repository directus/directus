import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { ContentVersion } from '@directus/types';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

import { useComparison } from './use-comparison';
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

		const comparisonData = ref(null);
		const { normalizeComparisonData } = useComparison({ comparisonData });
		const result = await normalizeComparisonData('version-123', 'version');

		expect(api.get).toHaveBeenCalledWith('/versions/version-123/compare');

		expect(result).toEqual({
			base: mockComparisonData.main,
			delta: mockComparisonData.current,
			selectableDeltas: [],
			comparisonType: 'version',
			outdated: false,
			mainHash: 'abc123',
			initialSelectedDeltaId: undefined,
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

		const comparisonData = ref(null);
		const { normalizeComparisonData } = useComparison({ comparisonData });
		const result = await normalizeComparisonData('version-123', 'version', currentVersion, versions);

		expect(api.get).toHaveBeenCalledWith('/versions/version-123/compare');

		expect(result).toEqual({
			base: mockComparisonData.main,
			delta: mockComparisonData.current,
			selectableDeltas: [mockVersion],
			comparisonType: 'version',
			outdated: true,
			mainHash: 'def456',
			initialSelectedDeltaId: 'version-123',
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

		const comparisonData = ref(null);
		const { normalizeComparisonData } = useComparison({ comparisonData });
		const result = await normalizeComparisonData('version-456', 'version', currentVersion, versions);

		expect(api.get).toHaveBeenCalledWith('/versions/version-456/compare');

		expect(result).toEqual({
			base: mockComparisonData.main,
			delta: mockComparisonData.current,
			selectableDeltas: [mockVersion],
			comparisonType: 'version',
			outdated: false,
			mainHash: 'ghi789',
			initialSelectedDeltaId: 'version-456',
		});
	});
});
