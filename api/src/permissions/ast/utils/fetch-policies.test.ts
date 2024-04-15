import { beforeEach, expect, test, vi } from 'vitest';
import type { AccessService } from '../../../services/access.js';
import { fetchPolicies } from './fetch-policies.js';

let service: AccessService;

beforeEach(() => {
	service = {
		readByQuery: vi.fn(),
	} as unknown as AccessService;
});

test('Fetches and returns policies from the access service where role is null when public flag is set', async () => {
	const mockServiceOutput: any[] = [];
	vi.mocked(service.readByQuery).mockResolvedValue(mockServiceOutput);

	const output = await fetchPolicies(service, true, [], null);

	expect(output).toBe(mockServiceOutput);

	expect(service.readByQuery).toHaveBeenCalledWith({
		fields: ['policy.id', 'policy.admin_access', 'policy.ip_access', 'sort', 'role'],
		sort: ['sort'],
		filter: { role: { _null: true } },
	});
});

test('Inserts filter for passed roles array', async () => {
	const mockServiceOutput: any[] = [];
	vi.mocked(service.readByQuery).mockResolvedValue(mockServiceOutput);

	const output = await fetchPolicies(service, false, ['test-role-a', 'test-role-b'], undefined);

	expect(output).toBe(mockServiceOutput);

	expect(service.readByQuery).toHaveBeenCalledWith({
		fields: ['policy', 'sort', 'role'],
		sort: ['role', 'sort'],
		filter: {
			role: { _in: ['test-role-a', 'test-role-b'] },
		},
	});
});

test('Inserts additional or filter for optional user ID', async () => {
	const mockServiceOutput: any[] = [];
	vi.mocked(service.readByQuery).mockResolvedValue(mockServiceOutput);

	const output = await fetchPolicies(service, false, ['test-role-a', 'test-role-b'], 'test-user-id');

	expect(output).toBe(mockServiceOutput);

	expect(service.readByQuery).toHaveBeenCalledWith({
		fields: ['policy', 'sort', 'role'],
		sort: ['role', 'sort'],
		filter: {
			_or: [{ user: { _eq: 'test-user-id' } }, { role: { _in: ['test-role-a', 'test-role-b'] } }],
		},
	});
});
