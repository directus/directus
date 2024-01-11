import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import ky, { type ResponsePromise } from 'ky';
import { constructText } from './lib/construct-text.js';
import { constructUrl } from './lib/construct-url.js';
import { convertToSearchResult } from './lib/convert-to-search-result.js';
import {
	RegistrySearchResponse,
	type RegistrySearchResponse as TRegistrySearchResponse,
} from './schemas/registry-search-response.js';
import { validateLimit } from './utils/validate-limit.js';
import { validateText } from './utils/validate-text.js';
import type { SearchResult } from './types/search-result.js';

import { search } from './search.js';

vi.mock('ky');
vi.mock('./lib/construct-text.js');
vi.mock('./lib/construct-url.js');
vi.mock('./lib/convert-to-search-result.js');
vi.mock('./schemas/registry-search-response.js');
vi.mock('./utils/validate-limit.js');
vi.mock('./utils/validate-text.js');

let mockResponse: Record<string, unknown>;

beforeEach(() => {
	mockResponse = {};
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn().mockResolvedValue(mockResponse) } as unknown as ResponsePromise);
});

afterEach(() => {
	vi.resetAllMocks();
});

test('Validates limit if limit option is passed', async () => {
	await search({ limit: 5 });
	expect(validateLimit).toHaveBeenCalledWith(5);
});

test('Validates text if text option is passed', async () => {
	await search({ text: 'some search query' });
	expect(validateText).toHaveBeenCalledWith('some search query');
});

test('Fetches results from npm based on options', async () => {
	const mockUrl = new URL('/test', 'http://example.com');
	vi.mocked(constructText).mockReturnValue('test-text');
	vi.mocked(constructUrl).mockReturnValue(mockUrl);

	await search({ limit: 5 });

	expect(constructText).toHaveBeenCalledWith({ limit: 5 });
	expect(constructUrl).toHaveBeenCalledWith('test-text', { limit: 5 });
	expect(ky.get).toHaveBeenCalledWith(mockUrl);
	expect(RegistrySearchResponse.parseAsync).toHaveBeenCalledWith(mockResponse);
});

test('Returns converted response', async () => {
	const mockParsedResponse = { parsed: true } as unknown as TRegistrySearchResponse;
	vi.mocked(RegistrySearchResponse.parseAsync).mockResolvedValue(mockParsedResponse);

	const mockConvertedResult = { converted: true } as unknown as SearchResult;
	vi.mocked(convertToSearchResult).mockReturnValue(mockConvertedResult);

	const res = await search();

	expect(convertToSearchResult).toHaveBeenCalledWith(mockParsedResponse);

	expect(res).toBe(mockConvertedResult);
});
