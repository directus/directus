import { _cache, getApiVersion } from './get-api-version.js';
import { RegistryVersionResponse } from '../schemas/registry-version-response.js';
import ky, { type ResponsePromise } from 'ky';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('ky');
vi.mock('../schemas/registry-version-response.js');

vi.mock('../constants.js', () => ({
	DEFAULT_REGISTRY: 'http://example.com',
}));

afterEach(() => {
	vi.resetAllMocks();
	_cache.clear();
});

test('Returns cached response early', async () => {
	_cache.set('http://example.com', 'cached-value');

	const version = await getApiVersion();

	expect(version).toBe('cached-value');
});

test('Requests version from default registry', async () => {
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);
	vi.mocked(RegistryVersionResponse.parseAsync).mockResolvedValue({ version: 'test-version' });

	await getApiVersion();

	const url = vi.mocked(ky.get).mock.calls[0]?.[0] as URL | undefined;

	expect(url).toBeInstanceOf(URL);
	expect(url?.hostname).toBe('example.com');
	expect(url?.protocol).toBe('http:');
	expect(url?.pathname).toBe('/version');
});

test('Requests version from custom registry if passed', async () => {
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);
	vi.mocked(RegistryVersionResponse.parseAsync).mockResolvedValue({ version: 'test-version' });

	await getApiVersion({ registry: 'https://registry.example.com' });

	const url = vi.mocked(ky.get).mock.calls[0]?.[0] as URL | undefined;

	expect(url).toBeInstanceOf(URL);
	expect(url?.hostname).toBe('registry.example.com');
	expect(url?.protocol).toBe('https:');
	expect(url?.pathname).toBe('/version');
});

test('Saves retrieved value in cache', async () => {
	const response = {};
	const version = 'test-version';

	vi.mocked(ky.get).mockReturnValue({ json: vi.fn().mockResolvedValue(response) } as unknown as ResponsePromise);
	vi.mocked(RegistryVersionResponse.parseAsync).mockResolvedValue({ version });

	await getApiVersion({ registry: 'https://registry.example.com' });

	expect(RegistryVersionResponse.parseAsync).toHaveBeenCalledWith(response);
	expect(_cache.get('https://registry.example.com')).toBe(version);
});

test('Returns memoized version', async () => {
	const response = {};
	const version = 'test-version';

	vi.mocked(ky.get).mockReturnValue({ json: vi.fn().mockResolvedValue(response) } as unknown as ResponsePromise);
	vi.mocked(RegistryVersionResponse.parseAsync).mockResolvedValue({ version });

	const res = await getApiVersion({ registry: 'https://registry.example.com' });

	expect(res).toBe(version);
});

test('Invalidates the cached value after 6 hours', async () => {
	const response = {};
	const version = 'test-version';

	vi.mocked(ky.get).mockReturnValue({ json: vi.fn().mockResolvedValue(response) } as unknown as ResponsePromise);
	vi.mocked(RegistryVersionResponse.parseAsync).mockResolvedValue({ version });

	vi.useFakeTimers();

	await getApiVersion();

	expect(_cache.has('http://example.com')).toBe(true);

	// 6h + 100ms
	vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 100);

	expect(_cache.has('http://example.com')).toBe(false);

	vi.useRealTimers();
});
