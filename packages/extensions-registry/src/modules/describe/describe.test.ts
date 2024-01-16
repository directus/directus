import ky, { type ResponsePromise } from 'ky';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { describe } from './describe.js';
import { constructUrl } from './lib/construct-url.js';
import { convertToDescribeResult } from './lib/convert-to-describe-result.js';
import {
	RegistryDescribeResponse,
	type RegistryDescribeResponse as TRegistryDescribeResponse,
} from './schemas/registry-describe-response.js';
import type { DescribeResult } from './types/describe-result.js';
import { validateName } from './utils/validate-name.js';

vi.mock('ky');
vi.mock('./lib/construct-url.js');
vi.mock('./lib/convert-to-describe-result.js');
vi.mock('./schemas/registry-describe-response.js');
vi.mock('./utils/validate-name.js');

let mockResponse: Record<string, unknown>;

beforeEach(() => {
	mockResponse = {};

	vi.mocked(ky.get).mockReturnValue({ json: vi.fn().mockResolvedValue(mockResponse) } as unknown as ResponsePromise);
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Validates passed name', async () => {
	await describe('@test/fake-extension');
	expect(validateName).toHaveBeenCalledWith('@test/fake-extension');
});

test('Fetches results from npm based on options', async () => {
	const mockUrl = new URL('/test', 'http://example.com');
	vi.mocked(constructUrl).mockReturnValue(mockUrl);

	await describe('@test/fake-extension');

	expect(constructUrl).toHaveBeenCalledWith('@test/fake-extension', {});
	expect(ky.get).toHaveBeenCalledWith(mockUrl);
	expect(RegistryDescribeResponse.parseAsync).toHaveBeenCalledWith(mockResponse);
});

test('Returns converted response', async () => {
	const mockParsedResponse = { parsed: true } as unknown as TRegistryDescribeResponse;
	vi.mocked(RegistryDescribeResponse.parseAsync).mockResolvedValue(mockParsedResponse);

	const mockConvertedResult = { converted: true } as unknown as DescribeResult;
	vi.mocked(convertToDescribeResult).mockReturnValue(mockConvertedResult);

	const res = await describe('@test/fake-extension');

	expect(convertToDescribeResult).toHaveBeenCalledWith(mockParsedResponse);

	expect(res).toBe(mockConvertedResult);
});
