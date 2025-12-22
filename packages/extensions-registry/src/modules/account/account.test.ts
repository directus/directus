import ky, { type ResponsePromise } from 'ky';
import { afterEach, expect, test, vi } from 'vitest';
import { assertVersionCompatibility } from '../../utils/assert-version-compatibility.js';
import { account } from './account.js';
import { constructUrl } from './lib/construct-url.js';
import {
	RegistryAccountResponse,
	type RegistryAccountResponse as TRegistryAccountResponse,
} from './schemas/registry-account-response.js';

vi.mock('ky');
vi.mock('../../utils/assert-version-compatibility.js');
vi.mock('./lib/construct-url.js');
vi.mock('./schemas/registry-account-response.js');

afterEach(() => {
	vi.resetAllMocks();
});

test('Calls assertVersionCompatibility with provided options', async () => {
	const options = { registry: 'https://custom-registry.example.com' };

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);
	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

	await account('test-id', options);

	expect(assertVersionCompatibility).toHaveBeenCalledWith(options);
});

test('Calls assertVersionCompatibility with undefined when no options provided', async () => {
	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);
	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

	await account('test-id');

	expect(assertVersionCompatibility).toHaveBeenCalledWith(undefined);
});

test('Throws if version compatibility assertion throws', async () => {
	const error = new Error('Version compatibility failed');
	vi.mocked(assertVersionCompatibility).mockRejectedValue(error);

	await expect(() => account('test-id')).rejects.toBe(error);
});

test('Constructs URL with correct parameters', async () => {
	const options = { registry: 'https://custom-registry.example.com' };

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);
	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

	await account('test-user', options);

	expect(constructUrl).toHaveBeenCalledWith('test-user', options);
});

test('Constructs URL with undefined options when none provided', async () => {
	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);
	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

	await account('test-user');

	expect(constructUrl).toHaveBeenCalledWith('test-user', undefined);
});

test('Fetches constructed URL using ky.get', async () => {
	const url = new URL('/accounts/test-user', 'https://registry.directus.io');

	vi.mocked(constructUrl).mockReturnValue(url);
	vi.mocked(ky.get).mockReturnValue({ json: vi.fn() } as unknown as ResponsePromise);
	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

	await account('test-user');

	expect(ky.get).toHaveBeenCalledWith(url);
});

test('Calls json() on the response', async () => {
	const jsonMock = vi.fn().mockResolvedValue({});

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));
	vi.mocked(ky.get).mockReturnValue({ json: jsonMock } as unknown as ResponsePromise);
	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

	await account('test-user');

	expect(jsonMock).toHaveBeenCalled();
});

test('Parses response using RegistryAccountResponse.parseAsync', async () => {
	const registryResponse = {
		data: {
			id: 'test-id',
			username: 'test-user',
			verified: true,
			github_username: 'test-github',
			github_avatar_url: 'https://github.com/avatar.jpg',
			github_name: 'Test User',
			github_company: 'Test Company',
			github_blog: 'https://blog.example.com',
			github_location: 'Test Location',
			github_bio: 'Test bio',
		},
	};

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));

	vi.mocked(ky.get).mockReturnValue({
		json: vi.fn().mockResolvedValue(registryResponse),
	} as unknown as ResponsePromise);

	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue(registryResponse as TRegistryAccountResponse);

	await account('test-user');

	expect(RegistryAccountResponse.parseAsync).toHaveBeenCalledWith(registryResponse);
});

test('Returns parsed registry account response', async () => {
	const registryResponse = {
		data: {
			id: 'test-id',
			username: 'test-user',
			verified: true,
			github_username: 'test-github',
			github_avatar_url: 'https://github.com/avatar.jpg',
			github_name: 'Test User',
			github_company: 'Test Company',
			github_blog: 'https://blog.example.com',
			github_location: 'Test Location',
			github_bio: 'Test bio',
		},
	};

	const parsedResponse = registryResponse as TRegistryAccountResponse;

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));

	vi.mocked(ky.get).mockReturnValue({
		json: vi.fn().mockResolvedValue(registryResponse),
	} as unknown as ResponsePromise);

	vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue(parsedResponse);

	const result = await account('test-user');

	expect(result).toBe(parsedResponse);
});

test('Propagates HTTP errors from ky.get', async () => {
	const httpError = new Error('Network error');

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));

	vi.mocked(ky.get).mockImplementation(() => {
		throw httpError;
	});

	await expect(() => account('test-user')).rejects.toBe(httpError);
});

test('Propagates JSON parsing errors', async () => {
	const jsonError = new Error('Invalid JSON');

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));

	vi.mocked(ky.get).mockReturnValue({
		json: vi.fn().mockRejectedValue(jsonError),
	} as unknown as ResponsePromise);

	await expect(() => account('test-user')).rejects.toBe(jsonError);
});

test('Propagates schema validation errors from parseAsync', async () => {
	const validationError = new Error('Schema validation failed');

	vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-id', 'http://example.com'));

	vi.mocked(ky.get).mockReturnValue({
		json: vi.fn().mockResolvedValue({}),
	} as unknown as ResponsePromise);

	vi.mocked(RegistryAccountResponse.parseAsync).mockRejectedValue(validationError);

	await expect(() => account('test-user')).rejects.toBe(validationError);
});

test('Handles different account ID formats', async () => {
	const testCases = ['simple-user', 'user@example.com', 'organization-name', 'user_with_underscores', '123456'];

	for (const accountId of testCases) {
		vi.resetAllMocks();

		vi.mocked(constructUrl).mockReturnValue(new URL(`/accounts/${accountId}`, 'http://example.com'));
		vi.mocked(ky.get).mockReturnValue({ json: vi.fn().mockResolvedValue({}) } as unknown as ResponsePromise);
		vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

		await account(accountId);

		expect(constructUrl).toHaveBeenCalledWith(accountId, undefined);
	}
});

test('Works with different registry options', async () => {
	const registryUrls = [
		'https://registry.directus.io',
		'https://custom-registry.example.com',
		'http://localhost:3000',
		'https://internal-registry.company.com',
	];

	for (const registry of registryUrls) {
		vi.resetAllMocks();

		const options = { registry };

		vi.mocked(constructUrl).mockReturnValue(new URL('/accounts/test-user', registry));
		vi.mocked(ky.get).mockReturnValue({ json: vi.fn().mockResolvedValue({}) } as unknown as ResponsePromise);
		vi.mocked(RegistryAccountResponse.parseAsync).mockResolvedValue({} as TRegistryAccountResponse);

		await account('test-user', options);

		expect(constructUrl).toHaveBeenCalledWith('test-user', options);
	}
});
