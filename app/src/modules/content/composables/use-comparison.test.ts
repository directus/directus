import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
	},
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

import api from '@/api';
import { useComparison } from './use-comparison';
import type { Revision } from '@/types/revisions';
import type { ContentVersion } from '@directus/types';
import { itemVersions, versionComparison, versionRevisions } from './test-fixtures';

describe('normalizeComparisonData', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
			}),
		);

		vi.clearAllMocks();
	});

	it('normalizes revision comparison using provided revisions list (no API calls)', async () => {
		const currentVersion = itemVersions.data[0] as unknown as ContentVersion;

		const versions = [currentVersion] as unknown as ContentVersion[];

		const revisions: Revision[] = versionRevisions.data as unknown as Revision[];

		(api.get as any).mockResolvedValueOnce({
			data: { data: versionComparison.data },
		});

		const comparisonData = ref(null);
		const { normalizeComparisonData } = useComparison({ comparisonData });

		const currentVersionRef = ref(currentVersion as unknown as ContentVersion | null);
		const versionsRef = ref(versions as unknown as ContentVersion[] | null);
		const revisionsRef = ref(revisions);
		const firstRevision = revisions[0]!;

		const result = await normalizeComparisonData(
			String(firstRevision.id),
			'revision',
			currentVersionRef,
			versionsRef,
			revisionsRef,
		);

		// Base should be main item + version delta
		expect(result.base.title).toBe(versionComparison.data.current.title);
		expect(result.base.things).toBe(versionComparison.data.current.things);
		expect(result.base.enable).toBe(true);

		expect(result.incoming.categories).toEqual({
			create: [],
			delete: [],
			update: [
				{
					category_id: '1',
					id: 2,
				},
			],
		});

		expect(result.base.date_updated).toBeNull();

		// Incoming should merge revision data and set date_updated from activity.timestamp
		expect(result.incoming.title).toBe(versionRevisions.data[0]!.data.title);
		expect(result.incoming.things).toBe('guitar');
		expect(result.incoming.enable).toBe(true);

		expect(result.incoming.categories).toEqual({
			create: [],
			delete: [],
			update: [
				{
					category_id: '1',
					id: 2,
				},
			],
		});

		expect(result.incoming.date_updated).toBe(versionRevisions.data[0]!.activity.timestamp);
	});

	it('normalizes version comparison using provided versions list', async () => {
		const currentVersion = itemVersions.data[0] as unknown as ContentVersion;

		const versions = [currentVersion] as unknown as ContentVersion[];

		(api.get as any).mockResolvedValueOnce({
			data: { data: versionComparison.data },
		});

		const comparisonData = ref(null);
		const { normalizeComparisonData } = useComparison({ comparisonData });

		const currentVersionRef = ref(currentVersion as unknown as ContentVersion | null);
		const versionsRef = ref(versions as unknown as ContentVersion[] | null);

		const result = await normalizeComparisonData(currentVersion.id, 'version', currentVersionRef, versionsRef);

		expect(result.base).toEqual(versionComparison.data.main);
		expect(result.incoming).toEqual(versionComparison.data.current);
	});
});
