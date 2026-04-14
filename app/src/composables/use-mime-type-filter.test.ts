import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { parseGlobalMimeTypeAllowList, useMimeTypeFilter } from './use-mime-type-filter';
import { useServerStore } from '@/stores/server';

vi.mock('@/stores/server', () => {
	return {
		useServerStore: vi.fn(),
	};
});

function mockServerStore(mimeTypeAllowList?: string[]) {
	vi.mocked(useServerStore).mockReturnValue({
		info: {
			files: {
				mimeTypeAllowList,
			},
		},
	} as any);
}

describe('parseGlobalMimeTypeAllowList', () => {
	it('should return undefined for undefined input', () => {
		expect(parseGlobalMimeTypeAllowList(undefined)).toBeUndefined();
	});

	it('should return undefined for empty array', () => {
		expect(parseGlobalMimeTypeAllowList([])).toBeUndefined();
	});

	it('should return undefined for ["*/*"] wildcard array', () => {
		expect(parseGlobalMimeTypeAllowList(['*/*'])).toBeUndefined();
	});

	it('should return array as-is', () => {
		expect(parseGlobalMimeTypeAllowList(['image/jpeg', 'image/png'])).toEqual(['image/jpeg', 'image/png']);
	});
});

describe('useMimeTypeFilter', () => {
	describe('mimeTypeFilter', () => {
		it('should return null when allowedMimeTypes is undefined', () => {
			mockServerStore();
			const { mimeTypeFilter } = useMimeTypeFilter(undefined);
			expect(mimeTypeFilter.value).toBeNull();
		});

		it('should return null when allowedMimeTypes is an empty array', () => {
			mockServerStore();
			const { mimeTypeFilter } = useMimeTypeFilter([]);
			expect(mimeTypeFilter.value).toBeNull();
		});

		it('should create an _eq filter for a specific MIME type', () => {
			mockServerStore();
			const { mimeTypeFilter } = useMimeTypeFilter(['image/jpeg']);

			expect(mimeTypeFilter.value).toEqual({
				type: {
					_eq: 'image/jpeg',
				},
			});
		});

		it('should create a _starts_with filter for a wildcard MIME type', () => {
			mockServerStore();
			const { mimeTypeFilter } = useMimeTypeFilter(['image/*']);

			expect(mimeTypeFilter.value).toEqual({
				type: {
					_starts_with: 'image/',
				},
			});
		});

		it('should create an _or filter for multiple MIME types', () => {
			mockServerStore();
			const { mimeTypeFilter } = useMimeTypeFilter(['image/jpeg', 'image/png']);

			expect(mimeTypeFilter.value).toEqual({
				_or: [
					{
						type: {
							_eq: 'image/jpeg',
						},
					},
					{
						type: {
							_eq: 'image/png',
						},
					},
				],
			});
		});

		it('should create an _or filter combining wildcards and specific types', () => {
			mockServerStore();
			const { mimeTypeFilter } = useMimeTypeFilter(['image/*', 'application/pdf']);

			expect(mimeTypeFilter.value).toEqual({
				_or: [
					{
						type: {
							_starts_with: 'image/',
						},
					},
					{
						type: {
							_eq: 'application/pdf',
						},
					},
				],
			});
		});

		it('should be reactive to ref changes', () => {
			mockServerStore();
			const mimeTypes = ref<string[]>(['image/jpeg']);
			const { mimeTypeFilter } = useMimeTypeFilter(mimeTypes);

			expect(mimeTypeFilter.value).toEqual({
				type: {
					_eq: 'image/jpeg',
				},
			});

			mimeTypes.value = ['video/*'];

			expect(mimeTypeFilter.value).toEqual({
				type: {
					_starts_with: 'video/',
				},
			});
		});
	});

	describe('combinedAcceptString', () => {
		it('should return interface types when no global types are set', () => {
			mockServerStore();
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png']);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should return global types when no interface types are set', () => {
			mockServerStore(['image/jpeg', 'image/png']);
			const { combinedAcceptString } = useMimeTypeFilter(undefined);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should return global types when interface types is empty', () => {
			mockServerStore(['image/jpeg', 'image/png']);
			const { combinedAcceptString } = useMimeTypeFilter([]);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should return undefined when both are undefined', () => {
			mockServerStore();
			const { combinedAcceptString } = useMimeTypeFilter(undefined);
			expect(combinedAcceptString.value).toBeUndefined();
		});

		it('should return interface types when global allows all types', () => {
			mockServerStore(['*/*']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'video/mp4']);
			expect(combinedAcceptString.value).toBe('image/jpeg,video/mp4');
		});

		it('should return intersection of specific types', () => {
			mockServerStore(['image/jpeg', 'image/gif']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png', 'application/pdf']);

			expect(combinedAcceptString.value).toBe('image/jpeg');
		});

		it('should return global types when there is no overlap', () => {
			mockServerStore(['video/mp4']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg']);
			expect(combinedAcceptString.value).toBe('video/mp4');
		});

		it('should be reactive to interface type ref changes', () => {
			mockServerStore(['image/jpeg', 'image/png']);
			const interfaceTypes = ref<string[]>(['image/jpeg']);
			const { combinedAcceptString } = useMimeTypeFilter(interfaceTypes);

			expect(combinedAcceptString.value).toBe('image/jpeg');

			interfaceTypes.value = ['image/png', 'application/pdf'];

			expect(combinedAcceptString.value).toBe('image/png');
		});
	});

	describe('global types from server store', () => {
		it('should use global types from server store', () => {
			mockServerStore(['image/jpeg', 'image/png']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'video/mp4']);
			expect(combinedAcceptString.value).toBe('image/jpeg');
		});

		it('should ignore ["*/*"] wildcard from server store', () => {
			mockServerStore(['*/*']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'video/mp4']);
			expect(combinedAcceptString.value).toBe('image/jpeg,video/mp4');
		});

		it('should return interface types when server store has no restriction', () => {
			mockServerStore(undefined);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'video/mp4']);
			expect(combinedAcceptString.value).toBe('image/jpeg,video/mp4');
		});
	});

	describe('mimeTypeMatches (tested through combinedAcceptString)', () => {
		it('should match any type with wildcard pattern', () => {
			mockServerStore(['*/*']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'video/mp4']);
			expect(combinedAcceptString.value).toBe('image/jpeg,video/mp4');
		});

		it('should match specific types against wildcard pattern', () => {
			mockServerStore(['image/*']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png', 'video/mp4']);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should match exact MIME types', () => {
			mockServerStore(['image/jpeg']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png']);
			expect(combinedAcceptString.value).toBe('image/jpeg');
		});

		it('should not match unrelated types', () => {
			mockServerStore(['video/mp4']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg']);
			// No overlap, so global takes precedence
			expect(combinedAcceptString.value).toBe('video/mp4');
		});
	});

	describe('intersectMimeTypes (tested through combinedAcceptString)', () => {
		it('should compute intersection of two specific type lists', () => {
			mockServerStore(['image/jpeg', 'image/gif', 'video/mp4']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png', 'image/gif']);

			expect(combinedAcceptString.value).toBe('image/jpeg,image/gif');
		});

		it('should narrow wildcard interface type to specific global types', () => {
			mockServerStore(['image/jpeg', 'image/png']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/*']);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should keep interface wildcard when global has matching wildcard', () => {
			mockServerStore(['image/*', 'video/*']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/*']);
			expect(combinedAcceptString.value).toBe('image/*');
		});

		it('should allow interface wildcard when global has broader wildcard', () => {
			mockServerStore(['*/*']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/*']);
			// When global allows all types, the interface types are returned as-is
			expect(combinedAcceptString.value).toBe('image/*');
		});

		it('should remove duplicates from result', () => {
			mockServerStore(['image/jpeg', 'image/jpeg']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/jpeg']);

			expect(combinedAcceptString.value).toBe('image/jpeg');
		});

		it('should handle complex intersection with mixed wildcards and specific types', () => {
			mockServerStore(['image/jpeg', 'image/png', 'application/pdf', 'video/mp4']);
			const { combinedAcceptString } = useMimeTypeFilter(['image/*', 'application/pdf']);

			expect(combinedAcceptString.value).toBe('image/jpeg,image/png,application/pdf');
		});

		it('should return global types when intersection is empty', () => {
			mockServerStore(['video/*']);
			const { combinedAcceptString } = useMimeTypeFilter(['audio/*']);
			expect(combinedAcceptString.value).toBe('video/*');
		});
	});
});
