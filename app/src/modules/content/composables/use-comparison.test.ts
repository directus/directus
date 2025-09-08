import { ContentVersion } from '@directus/types';
import { Revision } from '@/types/revisions';
import { describe, expect, test, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { useComparison } from './use-comparison';
import { getFieldsWithDifferences, normalizeComparisonData } from '../comparison-utils';

const mockRevisions: Revision[] = [
	{
		id: 733,
		collection: 'pages',
		item: '1ce02298-817a-46bc-ac92-6a6c10c20f88',
		data: {
			title: 'Harry',
		},
		delta: {
			title: 'Harry',
		},
		activity: {
			action: 'version_save',
			timestamp: '2025-09-08T15:53:39.585Z',
			ip: '127.0.0.1',
			user_agent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
			origin: 'http://localhost:8080',
			user: {
				id: '821f48c3-3606-4903-b424-a3f1c35315bf',
				email: 'rob.l@directus.io',
				first_name: 'Admin',
				last_name: 'User',
			},
		},
		timestampFormatted: 'Sep 8, 2025',
		timeRelative: '2 hours ago',
		status: 'resolve',
	},
	{
		id: 731,
		collection: 'pages',
		item: '1ce02298-817a-46bc-ac92-6a6c10c20f88',
		data: {
			title: 'Testing sept 8 2',
		},
		delta: {
			title: 'Testing sept 8 2',
		},
		activity: {
			action: 'version_save',
			timestamp: '2025-09-08T15:07:43.048Z',
			ip: '127.0.0.1',
			user_agent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
			origin: 'http://localhost:8080',
			user: {
				id: '821f48c3-3606-4903-b424-a3f1c35315bf',
				email: 'rob.l@directus.io',
				first_name: 'Admin',
				last_name: 'User',
			},
		},
		timestampFormatted: 'Sep 8, 2025',
		timeRelative: '3 hours ago',
		status: 'resolve',
	},
];

const mockVersions: ContentVersion[] = [
	{
		id: '5cd41cd0-51bf-4144-9e87-4fe273ce1d91',
		key: 'harrys-changes',
		name: "Harry's Changes",
		collection: 'pages',
		item: '1ce02298-817a-46bc-ac92-6a6c10c20f88',
		hash: '61abcd1e0515ca4b2f6c2f657b97e609dbfa7eac',
		date_created: '2025-08-27T21:53:26.535Z',
		date_updated: '2025-09-08T15:53:39.592Z',
		user_created: 'fab15de2-3ade-42e9-8c73-5ca81982ef8b',
		user_updated: null,
		delta: {
			title: 'Harry',
			status: 'in_review',
			published_at: '2024-09-09T16:00:00.000Z',
			permalink: '/blog-stuff',
		},
	},
	{
		id: '78345f0e-c70a-491a-9c39-4ffdd45a9b79',
		key: 'several-changes',
		name: 'several changes',
		collection: 'pages',
		item: '1ce02298-817a-46bc-ac92-6a6c10c20f88',
		hash: '2ce874df12d28d0db69bbdeba50f5ecc87f1783d',
		date_created: '2025-08-21T16:57:59.215Z',
		date_updated: '2025-08-21T16:59:01.591Z',
		user_created: '821f48c3-3606-4903-b424-a3f1c35315bf',
		user_updated: null,
		delta: {
			title: 'News',
			blocks: {
				create: [],
				update: [
					{
						collection: 'block_posts',
						item: {
							headline: 'All News, all the time',
							tagline: 'News',
							id: '060b632d-d70d-4db1-8b95-4fbab7a52ae8',
						},
						id: '45227f61-5ff1-431c-8dee-1a50d369325f',
					},
				],
				delete: [],
			},
		},
	},
];

describe('useComparison', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('with real version data', () => {
		test('should initialize with version data correctly', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);

			const { currentVersionDisplayName, versionDateUpdated, mainHash, comparedData } = useComparison({
				currentVersion,
				comparisonType,
			});

			expect(currentVersionDisplayName.value).toBe("Harry's Changes");

			expect(versionDateUpdated.value).toEqual(new Date('2025-09-08T15:53:39.592Z'));

			expect(mainHash.value).toBe('');

			expect(comparedData.value).toBeNull();
		});

		test('should handle version with null user_updated', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);
			const { versionDateUpdated } = useComparison({ currentVersion, comparisonType });

			expect(versionDateUpdated.value).toEqual(new Date('2025-09-08T15:53:39.592Z'));
		});

		test('should display version name when available', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);
			const { currentVersionDisplayName } = useComparison({ currentVersion, comparisonType });

			expect(currentVersionDisplayName.value).toBe("Harry's Changes");
		});

		test('should fallback to key when name is null', () => {
			const versionWithoutName = { ...mockVersions[0], name: null } as ContentVersion;
			const currentVersion = ref(versionWithoutName);
			const comparisonType = ref('version' as const);
			const { currentVersionDisplayName } = useComparison({ currentVersion, comparisonType });

			expect(currentVersionDisplayName.value).toBe('harrys-changes');
		});
	});

	describe('with real revision data', () => {
		test('should handle revision with user object', () => {
			const revisions = ref(mockRevisions);
			const selectedRevision = ref(733);
			const comparisonType = ref('revision' as const);
			const { userUpdated } = useComparison({ revisions, selectedRevision, comparisonType });

			// Should be null initially since we don't fetch user data in the composable
			expect(userUpdated.value).toBeNull();
		});

		test('should handle revision with string user', () => {
			const revisionWithStringUser = {
				...mockRevisions[0],
				activity: {
					...mockRevisions[0]!.activity,
					user: '821f48c3-3606-4903-b424-a3f1c35315bf',
				},
			};

			const revisions = ref([revisionWithStringUser]);
			const selectedRevision = ref(733);
			const comparisonType = ref('revision' as const);
			const { userUpdated } = useComparison({ revisions, selectedRevision, comparisonType });

			expect(userUpdated.value).toBeNull();
		});
	});

	describe('field selection and comparison', () => {
		test('should identify fields with differences', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);

			useComparison({ currentVersion, comparisonType });

			const mockComparison = {
				outdated: false,
				mainHash: 'abc123',
				current: {
					title: 'Harry',
					status: 'in_review',
					permalink: '/blog-stuff',
				},
				main: {
					title: 'Main title',
					status: 'published',
					permalink: '/blog-stuff',
				},
			};

			const differentFields = getFieldsWithDifferences(mockComparison);
			expect(differentFields).toEqual(['title', 'status']);
		});

		test('should handle identical objects', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);

			useComparison({ currentVersion, comparisonType });

			const mockComparison = {
				outdated: false,
				mainHash: 'abc123',
				current: {
					title: 'Same title',
					status: 'published',
				},
				main: {
					title: 'Same title',
					status: 'published',
				},
			};

			const differentFields = getFieldsWithDifferences(mockComparison);
			expect(differentFields).toEqual([]);
		});

		test('should handle nested object differences', () => {
			const currentVersion = ref(mockVersions[1] as ContentVersion);
			const comparisonType = ref('version' as const);

			useComparison({ currentVersion, comparisonType });

			const mockComparison = {
				outdated: false,
				mainHash: 'abc123',
				current: {
					title: 'News',
					blocks: {
						create: [],
						update: [{ id: '123', item: { headline: 'New headline' } }],
						delete: [],
					},
				},
				main: {
					title: 'News',
					blocks: {
						create: [],
						update: [{ id: '123', item: { headline: 'Old headline' } }],
						delete: [],
					},
				},
			};

			const differentFields = getFieldsWithDifferences(mockComparison);
			expect(differentFields).toEqual(['blocks']);
		});
	});

	describe('field selection management', () => {
		test('should toggle field selection', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);
			const { selectedComparisonFields, toggleComparisonField } = useComparison({ currentVersion, comparisonType });

			// Initially empty
			expect(selectedComparisonFields.value).toEqual([]);

			// Add field
			toggleComparisonField('title');
			expect(selectedComparisonFields.value).toEqual(['title']);

			// Add another field
			toggleComparisonField('status');
			expect(selectedComparisonFields.value).toEqual(['title', 'status']);

			// Remove field
			toggleComparisonField('title');
			expect(selectedComparisonFields.value).toEqual(['status']);
		});

		test('should toggle select all', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);
			const { selectedComparisonFields, toggleSelectAll } = useComparison({ currentVersion, comparisonType });

			// Select all (will be empty since no fields with differences)
			toggleSelectAll();
			expect(selectedComparisonFields.value).toEqual([]);

			// Deselect all
			toggleSelectAll();
			expect(selectedComparisonFields.value).toEqual([]);
		});

		test('should calculate selection states correctly', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);

			const { allFieldsSelected, someFieldsSelected, availableFieldsCount } = useComparison({
				currentVersion,
				comparisonType,
			});

			// Initially no fields selected
			expect(allFieldsSelected.value).toBe(false);
			expect(someFieldsSelected.value).toBe(false);
			expect(availableFieldsCount.value).toBe(0);
		});
	});

	describe('normalizeComparisonData', () => {
		test('should normalize version data correctly', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);

			useComparison({ currentVersion, comparisonType });

			const normalized = normalizeComparisonData(mockVersions[0] as ContentVersion, 'version');

			expect(normalized).toEqual({
				outdated: false,
				mainHash: '61abcd1e0515ca4b2f6c2f657b97e609dbfa7eac',
				current: {
					title: 'Harry',
					status: 'in_review',
					published_at: '2024-09-09T16:00:00.000Z',
					permalink: '/blog-stuff',
				},
				main: {},
			});
		});

		test('should normalize revision data correctly', () => {
			const revisions = ref(mockRevisions);
			const selectedRevision = ref(733);
			const comparisonType = ref('revision' as const);

			useComparison({ revisions, selectedRevision, comparisonType });

			const normalized = normalizeComparisonData(mockRevisions[0] as Revision, 'revision');

			expect(normalized).toEqual({
				outdated: false,
				mainHash: '',
				current: {
					title: 'Harry',
				},
				main: {
					title: 'Harry',
				},
			});
		});

		test('should handle null delta and data', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);

			useComparison({ currentVersion, comparisonType });

			const versionWithNulls = { ...mockVersions[0], delta: null } as ContentVersion;
			const revisionWithNulls = { ...mockRevisions[0], data: null, delta: null } as Revision;

			const normalizedVersion = normalizeComparisonData(versionWithNulls, 'version');
			const normalizedRevision = normalizeComparisonData(revisionWithNulls, 'revision');

			expect(normalizedVersion.current).toEqual({});
			expect(normalizedRevision.current).toEqual({});
			expect(normalizedRevision.main).toEqual({});
		});

		test('should throw error for invalid comparison type', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);

			useComparison({ currentVersion, comparisonType });

			expect(() => {
				normalizeComparisonData(mockVersions[0] as ContentVersion, 'invalid' as any);
			}).toThrow('Invalid comparison type');
		});
	});

	describe('date handling', () => {
		test('should handle version date_updated', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);
			const { versionDateUpdated } = useComparison({ currentVersion, comparisonType });

			expect(versionDateUpdated.value).toEqual(new Date('2025-09-08T15:53:39.592Z'));
		});

		test('should handle version without date_updated', () => {
			const versionWithoutDate = { ...mockVersions[0], date_updated: null } as ContentVersion;
			const currentVersion = ref(versionWithoutDate);
			const comparisonType = ref('version' as const);
			const { versionDateUpdated } = useComparison({ currentVersion, comparisonType });

			expect(versionDateUpdated.value).toBeNull();
		});

		test('should handle main item date fields', () => {
			const currentVersion = ref(mockVersions[0] as ContentVersion);
			const comparisonType = ref('version' as const);
			const { mainItemDateUpdated } = useComparison({ currentVersion, comparisonType });

			// Should be null initially since comparedData is null
			expect(mainItemDateUpdated.value).toBeNull();
		});
	});
});
