import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useMimeTypeFilter } from './use-mime-type-filter';

describe('useMimeTypeFilter', () => {
	describe('mimeTypeFilter', () => {
		it('should return null when allowedMimeTypes is undefined', () => {
			const { mimeTypeFilter } = useMimeTypeFilter(undefined);
			expect(mimeTypeFilter.value).toBeNull();
		});

		it('should return null when allowedMimeTypes is an empty array', () => {
			const { mimeTypeFilter } = useMimeTypeFilter([]);
			expect(mimeTypeFilter.value).toBeNull();
		});

		it('should create an _eq filter for a specific MIME type', () => {
			const { mimeTypeFilter } = useMimeTypeFilter(['image/jpeg']);

			expect(mimeTypeFilter.value).toEqual({
				type: {
					_eq: 'image/jpeg',
				},
			});
		});

		it('should create a _starts_with filter for a wildcard MIME type', () => {
			const { mimeTypeFilter } = useMimeTypeFilter(['image/*']);

			expect(mimeTypeFilter.value).toEqual({
				type: {
					_starts_with: 'image/',
				},
			});
		});

		it('should create an _or filter for multiple MIME types', () => {
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
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png'], undefined);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should return interface types when global types is empty', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png'], []);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should return global types when no interface types are set', () => {
			const { combinedAcceptString } = useMimeTypeFilter(undefined, ['image/jpeg', 'image/png']);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should return global types when interface types is empty', () => {
			const { combinedAcceptString } = useMimeTypeFilter([], ['image/jpeg', 'image/png']);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should return undefined when both are undefined', () => {
			const { combinedAcceptString } = useMimeTypeFilter(undefined, undefined);
			expect(combinedAcceptString.value).toBeUndefined();
		});

		it('should return intersection of specific types', () => {
			const { combinedAcceptString } = useMimeTypeFilter(
				['image/jpeg', 'image/png', 'application/pdf'],
				['image/jpeg', 'image/gif'],
			);

			expect(combinedAcceptString.value).toBe('image/jpeg');
		});

		it('should return global types when there is no overlap', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg'], ['video/mp4']);
			expect(combinedAcceptString.value).toBe('video/mp4');
		});

		it('should be reactive to ref changes', () => {
			const interfaceTypes = ref<string[]>(['image/jpeg']);
			const globalTypes = ref<string[]>(['image/jpeg', 'image/png']);
			const { combinedAcceptString } = useMimeTypeFilter(interfaceTypes, globalTypes);

			expect(combinedAcceptString.value).toBe('image/jpeg');

			interfaceTypes.value = ['image/png', 'application/pdf'];

			expect(combinedAcceptString.value).toBe('image/png');
		});
	});

	describe('mimeTypeMatches (tested through combinedAcceptString)', () => {
		it('should match any type with */* pattern', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'video/mp4'], ['*/*']);
			expect(combinedAcceptString.value).toBe('image/jpeg,video/mp4');
		});

		it('should match specific types against wildcard pattern', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png', 'video/mp4'], ['image/*']);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should match exact MIME types', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/png'], ['image/jpeg']);
			expect(combinedAcceptString.value).toBe('image/jpeg');
		});

		it('should not match unrelated types', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg'], ['video/mp4']);
			// No overlap, so global takes precedence
			expect(combinedAcceptString.value).toBe('video/mp4');
		});
	});

	describe('intersectMimeTypes (tested through combinedAcceptString)', () => {
		it('should compute intersection of two specific type lists', () => {
			const { combinedAcceptString } = useMimeTypeFilter(
				['image/jpeg', 'image/png', 'image/gif'],
				['image/jpeg', 'image/gif', 'video/mp4'],
			);

			expect(combinedAcceptString.value).toBe('image/jpeg,image/gif');
		});

		it('should narrow wildcard interface type to specific global types', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/*'], ['image/jpeg', 'image/png']);
			expect(combinedAcceptString.value).toBe('image/jpeg,image/png');
		});

		it('should keep interface wildcard when global has matching wildcard', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/*'], ['image/*', 'video/*']);
			expect(combinedAcceptString.value).toBe('image/*');
		});

		it('should allow interface wildcard when global has broader wildcard', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/*'], ['*/*']);
			// When global allows all types (*/*), the interface wildcard is allowed
			// and the result includes */* since it matches the interface pattern
			expect(combinedAcceptString.value).toBe('*/*');
		});

		it('should remove duplicates from result', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['image/jpeg', 'image/jpeg'], ['image/jpeg', 'image/jpeg']);

			expect(combinedAcceptString.value).toBe('image/jpeg');
		});

		it('should handle complex intersection with mixed wildcards and specific types', () => {
			const { combinedAcceptString } = useMimeTypeFilter(
				['image/*', 'application/pdf'],
				['image/jpeg', 'image/png', 'application/pdf', 'video/mp4'],
			);

			expect(combinedAcceptString.value).toBe('image/jpeg,image/png,application/pdf');
		});

		it('should return global types when intersection is empty', () => {
			const { combinedAcceptString } = useMimeTypeFilter(['audio/*'], ['video/*']);
			expect(combinedAcceptString.value).toBe('video/*');
		});
	});
});
