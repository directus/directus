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

const itemVersions = {
	data: [
		{
			id: 'cbbd19f9-a826-4850-9038-85f68508300f',
			key: 'comparison-item-1-version-1',
			name: 'Comparison Item 1 - Version 1',
			collection: 'comparison_tests',
			item: '1',
			date_created: '2025-09-19T20:09:42.498Z',
			date_updated: '2025-09-19T20:10:52.897Z',
			user_created: '821f48c3-3606-4903-b424-a3f1c35315bf',
			user_updated: null,
			hash: '0ef0f677fcef0f9201fd35e1eca71060b9178884',
		},
	],
};

const versionComparison = {
	data: {
		outdated: false,
		mainHash: '0ef0f677fcef0f9201fd35e1eca71060b9178884',
		current: {
			title: 'Comparison Item 1 - Version 1 - Revision 1',
			description:
				'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.\nrevision 1',
			things: 'guitar',
			enable: true,
			categories: {
				create: [],
				update: [
					{
						category_id: '1',
						id: 2,
					},
				],
				delete: [],
			},
		},
		main: {
			id: 1,
			status: 'draft',
			sort: null,
			user_created: '821f48c3-3606-4903-b424-a3f1c35315bf',
			date_created: '2025-09-19T20:08:20.419Z',
			user_updated: null,
			date_updated: null,
			title: 'Comparison Item 1',
			description:
				'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.',
			things: 'apple',
			enable: null,
			categories: [1],
		},
	},
};

const versionRevisions = {
	data: [
		{
			id: 804,
			data: {
				title: 'Comparison Item 1 - Version 1 - Revision 1',
				description:
					'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.\nrevision 1',
				things: 'guitar',
				enable: true,
				categories: {
					create: [],
					update: [
						{
							category_id: '1',
							id: 2,
						},
					],
					delete: [],
				},
			},
			delta: {
				title: 'Comparison Item 1 - Version 1 - Revision 1',
				description:
					'Id ad eiusmod pariatur nulla id. Lorem anim aliqua labore pariatur occaecat. Ea anim consequat magna minim tempor officia adipisicing sunt velit ad. Voluptate aliqua aute fugiat.\nrevision 1',
				things: 'guitar',
				enable: true,
				categories: {
					create: [],
					update: [
						{
							category_id: '1',
							id: 2,
						},
					],
					delete: [],
				},
			},
			collection: 'comparison_tests',
			version: 'cbbd19f9-a826-4850-9038-85f68508300f',
			item: '1',
			activity: {
				action: 'version_save',
				timestamp: '2025-09-19T20:10:52.890Z',
				user: '821f48c3-3606-4903-b424-a3f1c35315bf',
			},
		},
	],
};

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

		const firstRevision = revisions[0]!;

		const result = await normalizeComparisonData(firstRevision.id, 'revision', currentVersion, versions, revisions);

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

		const result = await normalizeComparisonData(currentVersion.id, 'version', currentVersion, versions);

		expect(result.base).toEqual(versionComparison.data.main);
		// Check that the incoming data contains the expected fields from versionComparison.data.current
		expect(result.incoming.title).toBe(versionComparison.data.current.title);
		expect(result.incoming.description).toBe(versionComparison.data.current.description);
		expect(result.incoming.things).toBe(versionComparison.data.current.things);
		expect(result.incoming.enable).toBe(versionComparison.data.current.enable);
		expect(result.incoming.categories).toEqual(versionComparison.data.current.categories);
	});
});
