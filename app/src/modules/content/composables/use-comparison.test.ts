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
import { getFieldsWithDifferences } from '../comparison-utils';

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
		// Check that the incoming data contains the expected fields from versionComparison.data.current
		expect(result.incoming.title).toBe(versionComparison.data.current.title);
		expect(result.incoming.description).toBe(versionComparison.data.current.description);
		expect(result.incoming.things).toBe(versionComparison.data.current.things);
		expect(result.incoming.enable).toBe(versionComparison.data.current.enable);
		expect(result.incoming.categories).toEqual(versionComparison.data.current.categories);
	});
});

describe('getFieldsWithDifferences', () => {
	it('excludes related item fields when comparing revisions', () => {
		const comparedData = {
			outdated: false,
			mainHash: '',
			incoming: {
				title: 'New Title',
				description: 'New Description',
				related_items: [{ id: 1, name: 'Item 1' }],
				categories: [{ id: 2, name: 'Category 1' }],
				status: 'published',
			},
			base: {
				title: 'Old Title',
				description: 'Old Description',
				related_items: [{ id: 2, name: 'Item 2' }],
				categories: [{ id: 3, name: 'Category 2' }],
				status: 'draft',
			},
		};

		const fieldMetadata = {
			title: { meta: { special: [] } },
			description: { meta: { special: [] } },
			related_items: { meta: { special: ['m2m'] } },
			categories: { meta: { special: ['o2m'] } },
			status: { meta: { special: [] } },
		};

		// Test version comparison - should include all fields with differences
		const versionFields = getFieldsWithDifferences(comparedData, fieldMetadata, 'version');
		expect(versionFields).toContain('title');
		expect(versionFields).toContain('description');
		expect(versionFields).toContain('related_items');
		expect(versionFields).toContain('categories');
		expect(versionFields).toContain('status');

		// Test revision comparison - should exclude related item fields
		const revisionFields = getFieldsWithDifferences(comparedData, fieldMetadata, 'revision');
		expect(revisionFields).toContain('title');
		expect(revisionFields).toContain('description');
		expect(revisionFields).toContain('status');
		expect(revisionFields).not.toContain('related_items');
		expect(revisionFields).not.toContain('categories');
	});

	it('includes related item fields when comparing versions', () => {
		const comparedData = {
			outdated: false,
			mainHash: '',
			incoming: {
				title: 'New Title',
				related_items: [{ id: 1, name: 'Item 1' }],
			},
			base: {
				title: 'Old Title',
				related_items: [{ id: 2, name: 'Item 2' }],
			},
		};

		const fieldMetadata = {
			title: { meta: { special: [] } },
			related_items: { meta: { special: ['m2m'] } },
		};

		// Version comparison should include related item fields
		const versionFields = getFieldsWithDifferences(comparedData, fieldMetadata, 'version');
		expect(versionFields).toContain('title');
		expect(versionFields).toContain('related_items');
	});
});
