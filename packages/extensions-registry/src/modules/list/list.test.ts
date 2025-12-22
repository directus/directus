import ky, { type ResponsePromise } from 'ky';
import { afterEach, expect, test, vi } from 'vitest';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { constructUrl } from './lib/construct-url.js';
import { list } from './list.js';
import {
	RegistryListResponse,
	type RegistryListResponse as TRegistryListResponse,
} from './schemas/registry-list-response.js';

vi.mock('ky');
vi.mock('../../utils/assert-version-compatibility.js');
vi.mock('./lib/construct-url.js');
vi.mock('./schemas/registry-list-response.js');

afterEach(() => {
	vi.resetAllMocks();
});

test('Throws if version compatibility assertion throws', async () => {
	const error = new Error();
	vi.mocked(assertVersionCompatibility).mockRejectedValue(error);

	await expect(() => list({})).rejects.toBe(error);
});

test('Fetches constructed URL', async () => {
	const url = new URL('/extensions/test-id', 'http://example.com');

	const query = {};
	const options = {};

	vi.mocked(constructUrl).mockReturnValue(url);
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);

	await list(query, options);

	expect(constructUrl).toHaveBeenCalledWith(query, options);
	expect(ky.get).toHaveBeenCalledWith(url);
});

test('Returns parsed registry describe response', async () => {
	const registryResponse = {};
	const parsedResponse = {} as unknown as TRegistryListResponse;

	vi.mocked(ky.get).mockReturnValue({
		json: vi.fn().mockResolvedValue(registryResponse),
	} as unknown as ResponsePromise);

	vi.mocked(RegistryListResponse.parseAsync).mockResolvedValue(parsedResponse);

	const result = await list({});

	expect(RegistryListResponse.parseAsync).toHaveBeenCalledWith(registryResponse);

	expect(result).toBe(parsedResponse);
});
