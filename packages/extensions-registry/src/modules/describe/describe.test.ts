import { describe } from './describe.js';
import { constructUrl } from './lib/construct-url.js';
import {
	RegistryDescribeResponse,
	type RegistryDescribeResponse as TRegistryDescribeResponse,
} from './schemas/registry-describe-response.js';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import ky, { type ResponsePromise } from 'ky';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('ky');
vi.mock('../../utils/assert-version-compatibility.js');
vi.mock('./lib/construct-url.js');
vi.mock('./schemas/registry-describe-response.js');

afterEach(() => {
	vi.resetAllMocks();
});

test('Throws if version compatibility assertion throws', async () => {
	const error = new Error();
	vi.mocked(assertVersionCompatibility).mockRejectedValue(error);

	await expect(() => describe('test-id')).rejects.toBe(error);
});

test('Fetches constructed URL', async () => {
	const url = new URL('/extensions/test-id', 'http://example.com');

	vi.mocked(constructUrl).mockReturnValue(url);
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);

	await describe('test-id');

	expect(ky.get).toHaveBeenCalledWith(url);
});

test('Returns parsed registry describe response', async () => {
	const registryResponse = {};
	const parsedResponse = {} as unknown as TRegistryDescribeResponse;

	vi.mocked(ky.get).mockReturnValue({
		json: vi.fn().mockResolvedValue(registryResponse),
	} as unknown as ResponsePromise);

	vi.mocked(RegistryDescribeResponse.parseAsync).mockResolvedValue(parsedResponse);

	const result = await describe('test-id');

	expect(RegistryDescribeResponse.parseAsync).toHaveBeenCalledWith(registryResponse);

	expect(result).toBe(parsedResponse);
});
