import { afterEach, describe, expect, test, vi } from 'vite-plus/test';
import { useSafeRedirect } from './use-safe-redirect';
import api from '@/api';

vi.mock('@/api', () => ({
	default: {
		post: vi.fn(),
	},
}));

vi.mock('@/utils/get-root-path', async (importOriginal) => {
	const mod = await importOriginal();

	return {
		// @ts-ignore
		...mod,
		getPublicURL: () => 'http://localhost:8055/',
	};
});

afterEach(() => {
	vi.mocked(api.post).mockReset();
});

describe('useSafeRedirect', () => {
	test('redirect starts as null', () => {
		const { redirect } = useSafeRedirect();
		expect(redirect.value).toBeNull();
	});

	test('resolveRedirect does nothing for null/undefined', async () => {
		const { redirect, resolveRedirect } = useSafeRedirect();

		await resolveRedirect(null);
		expect(redirect.value).toBeNull();
		expect(api.post).not.toHaveBeenCalled();

		await resolveRedirect(undefined);
		expect(redirect.value).toBeNull();
		expect(api.post).not.toHaveBeenCalled();
	});

	test('resolveRedirect sets redirect for relative path', async () => {
		vi.mocked(api.post).mockResolvedValue({ data: { data: '/admin/content' } });

		const { redirect, resolveRedirect } = useSafeRedirect();

		await resolveRedirect('/admin/content');

		expect(api.post).toHaveBeenCalledWith('/utils/resolve-redirect', {
			redirect: '/admin/content',
			provider: undefined,
		});

		expect(redirect.value).toBe('/admin/content');
	});

	test('resolveRedirect converts public URL to relative path', async () => {
		vi.mocked(api.post).mockResolvedValue({ data: { data: 'http://localhost:8055/admin/content' } });

		const { redirect, resolveRedirect } = useSafeRedirect();

		await resolveRedirect('http://localhost:8055/admin/content');

		expect(redirect.value).toBe('/content');
	});

	test('resolveRedirect preserves query and hash when converting to relative path', async () => {
		vi.mocked(api.post).mockResolvedValue({ data: { data: 'http://localhost:8055/admin/content?foo=bar#section' } });

		const { redirect, resolveRedirect } = useSafeRedirect();

		await resolveRedirect('http://localhost:8055/admin/content?foo=bar#section');

		expect(redirect.value).toBe('/content?foo=bar#section');
	});

	test('resolveRedirect keeps external URLs as-is', async () => {
		vi.mocked(api.post).mockResolvedValue({ data: { data: 'https://external.com/callback' } });

		const { redirect, resolveRedirect } = useSafeRedirect();

		await resolveRedirect('https://external.com/callback', 'google');

		expect(redirect.value).toBe('https://external.com/callback');
	});

	test('resolveRedirect passes provider to API', async () => {
		vi.mocked(api.post).mockResolvedValue({ data: { data: 'https://external.com/callback' } });

		const { resolveRedirect } = useSafeRedirect();

		await resolveRedirect('https://external.com/callback', 'google');

		expect(api.post).toHaveBeenCalledWith('/utils/resolve-redirect', {
			redirect: 'https://external.com/callback',
			provider: 'google',
		});
	});

	test('resolveRedirect sets null on API error', async () => {
		vi.mocked(api.post).mockRejectedValue(new Error('Network error'));

		const { redirect, resolveRedirect } = useSafeRedirect();

		await resolveRedirect('https://evil.com');

		expect(redirect.value).toBeNull();
	});
});
