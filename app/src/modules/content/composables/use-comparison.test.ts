import { ContentVersion } from '@directus/types';
import { Revision } from '@/types/revisions';
import { describe, expect, test } from 'vitest';
import { ref } from 'vue';
import { useComparison } from './use-comparison';

describe('useComparison', () => {
	describe('normalizeComparisonData', () => {
		test('should return the same shape for version and revision inputs', () => {
			// Create a mock version
			const mockVersion: ContentVersion = {
				id: 'version-1',
				key: 'draft',
				name: 'My Draft',
				collection: 'articles',
				item: '123',
				hash: 'abc123',
				date_created: '2023-01-01T00:00:00Z',
				date_updated: '2023-01-02T00:00:00Z',
				user_created: 'user-1',
				user_updated: 'user-2',
				delta: {
					title: 'Updated Title',
					content: 'Updated content',
				},
			};

			// Create a mock revision
			const mockRevision: Revision = {
				id: 1,
				collection: 'articles',
				item: '123',
				activity: {
					action: 'update',
					ip: '127.0.0.1',
					user_agent: 'Mozilla/5.0',
					origin: 'https://example.com',
					timestamp: '2023-01-02T00:00:00Z',
					user: {
						id: 'user-2',
						email: 'user@example.com',
						first_name: 'John',
						last_name: 'Doe',
					},
				},
				data: {
					title: 'Updated Title',
					content: 'Updated content',
					status: 'published',
				},
				delta: {
					title: 'Updated Title',
					content: 'Updated content',
				},
				timestampFormatted: 'Jan 2, 2023',
				timeRelative: '2 days ago',
				status: 'resolve',
			};

			// Create a mock currentVersion ref for the composable
			const currentVersion = ref(mockVersion);
			const { normalizeComparisonData } = useComparison(currentVersion);

			// Test version normalization
			const normalizedVersion = normalizeComparisonData(mockVersion, 'version');

			// Test revision normalization
			const normalizedRevision = normalizeComparisonData(mockRevision, 'revision');

			// Both should have the same shape
			expect(normalizedVersion).toHaveProperty('outdated');
			expect(normalizedVersion).toHaveProperty('mainHash');
			expect(normalizedVersion).toHaveProperty('current');
			expect(normalizedVersion).toHaveProperty('main');

			expect(normalizedRevision).toHaveProperty('outdated');
			expect(normalizedRevision).toHaveProperty('mainHash');
			expect(normalizedRevision).toHaveProperty('current');
			expect(normalizedRevision).toHaveProperty('main');

			// Check that the shapes are identical
			expect(Object.keys(normalizedVersion)).toEqual(Object.keys(normalizedRevision));

			// Check specific values for version
			expect(normalizedVersion.outdated).toBe(false);
			expect(normalizedVersion.mainHash).toBe('abc123');

			expect(normalizedVersion.current).toEqual({
				title: 'Updated Title',
				content: 'Updated content',
			});

			expect(normalizedVersion.main).toEqual({});

			// Check specific values for revision
			expect(normalizedRevision.outdated).toBe(false);
			expect(normalizedRevision.mainHash).toBe('');

			expect(normalizedRevision.current).toEqual({
				title: 'Updated Title',
				content: 'Updated content',
			});

			expect(normalizedRevision.main).toEqual({
				title: 'Updated Title',
				content: 'Updated content',
				status: 'published',
			});
		});

		test('should handle empty delta/data gracefully', () => {
			const mockVersion: ContentVersion = {
				id: 'version-1',
				key: 'draft',
				name: 'My Draft',
				collection: 'articles',
				item: '123',
				hash: 'abc123',
				date_created: '2023-01-01T00:00:00Z',
				date_updated: '2023-01-02T00:00:00Z',
				user_created: 'user-1',
				user_updated: 'user-2',
				delta: null,
			};

			const mockRevision: Revision = {
				id: 1,
				collection: 'articles',
				item: '123',
				activity: {
					action: 'update',
					ip: '127.0.0.1',
					user_agent: 'Mozilla/5.0',
					origin: 'https://example.com',
					timestamp: '2023-01-02T00:00:00Z',
					user: 'user-2',
				},
				data: null,
				delta: null,
				timestampFormatted: 'Jan 2, 2023',
				timeRelative: '2 days ago',
				status: 'resolve',
			};

			const currentVersion = ref(mockVersion);
			const { normalizeComparisonData } = useComparison(currentVersion);

			const normalizedVersion = normalizeComparisonData(mockVersion, 'version');
			const normalizedRevision = normalizeComparisonData(mockRevision, 'revision');

			expect(normalizedVersion.current).toEqual({});
			expect(normalizedRevision.current).toEqual({});
		});

		test('should throw error for invalid comparison type', () => {
			const mockVersion: ContentVersion = {
				id: 'version-1',
				key: 'draft',
				name: 'My Draft',
				collection: 'articles',
				item: '123',
				hash: 'abc123',
				date_created: '2023-01-01T00:00:00Z',
				date_updated: '2023-01-02T00:00:00Z',
				user_created: 'user-1',
				user_updated: 'user-2',
				delta: null,
			};

			const currentVersion = ref(mockVersion);
			const { normalizeComparisonData } = useComparison(currentVersion);

			expect(() => {
				normalizeComparisonData(mockVersion, 'invalid' as any);
			}).toThrow('Invalid comparison type');
		});
	});
});
