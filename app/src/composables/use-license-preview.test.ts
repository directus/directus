import { describe, expect, test, vi } from 'vitest';
import { useLicensePreview } from './use-license-preview';

const { apiPost } = vi.hoisted(() => ({
	apiPost: vi.fn(),
}));

vi.mock('@/api', () => ({
	default: {
		post: apiPost,
	},
}));

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { promise, resolve, reject };
}

describe('useLicensePreview', () => {
	test('keeps the previous validation error visible until the next request finishes', async () => {
		const preview = useLicensePreview();
		const pendingRequest = deferred<{ data: { data: { valid: true; plan: { name: string } } } }>();

		apiPost.mockResolvedValueOnce({
			data: {
				data: {
					valid: false,
				},
			},
		});

		await preview.fetchPreview('invalid-key');
		expect(preview.previewPayload.value).toEqual({ valid: false });
		expect(preview.validationError.value).toBeNull();

		apiPost.mockReturnValueOnce(pendingRequest.promise);

		const nextRequest = preview.fetchPreview('valid-key');

		expect(preview.validating.value).toBe(true);
		expect(preview.previewPayload.value).toEqual({ valid: false });
		expect(preview.validationError.value).toBeNull();

		pendingRequest.resolve({
			data: {
				data: {
					valid: true,
					plan: { name: 'Team Plan' },
				},
			},
		});

		await nextRequest;

		expect(preview.validating.value).toBe(false);

		expect(preview.previewPayload.value).toEqual({
			valid: true,
			plan: { name: 'Team Plan' },
		});

		expect(preview.validationError.value).toBeNull();
	});

	test('ignores stale responses from older preview requests', async () => {
		const preview = useLicensePreview();
		const firstRequest = deferred<{ data: { data: { valid: true; plan: { name: string } } } }>();
		const secondRequest = deferred<{ data: { data: { valid: true; plan: { name: string } } } }>();

		apiPost.mockReturnValueOnce(firstRequest.promise);
		const firstPromise = preview.fetchPreview('first-key');

		apiPost.mockReturnValueOnce(secondRequest.promise);
		const secondPromise = preview.fetchPreview('second-key');

		secondRequest.resolve({
			data: {
				data: {
					valid: true,
					plan: { name: 'Second Plan' },
				},
			},
		});

		await secondPromise;

		firstRequest.resolve({
			data: {
				data: {
					valid: true,
					plan: { name: 'First Plan' },
				},
			},
		});

		await firstPromise;

		expect(preview.previewPayload.value).toEqual({
			valid: true,
			plan: { name: 'Second Plan' },
		});

		expect(preview.validationError.value).toBeNull();

		expect(preview.validating.value).toBe(false);
	});
});
