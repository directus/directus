import { flushPromises } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { ref } from 'vue';
import { useIsAttachedToPublicRole } from './use-is-attached-to-public-role';
import api from '@/api';

vi.mock('@/api');
vi.mock('@/utils/unexpected-error');

beforeEach(() => {
	vi.mocked(api.get).mockReset();
});

test('queries the access rows attaching the policy to the Public role', async () => {
	vi.mocked(api.get).mockResolvedValue({ data: { data: [{ id: 'access-1' }] } });

	const isAttachedToPublicRole = useIsAttachedToPublicRole(ref('policy-1'));
	await flushPromises();

	expect(isAttachedToPublicRole.value).toBe(true);

	expect(api.get).toHaveBeenCalledWith('/access', {
		params: {
			filter: { _and: [{ policy: { _eq: 'policy-1' } }, { role: { _null: true } }, { user: { _null: true } }] },
			fields: ['id'],
			limit: 1,
		},
	});
});

test('is false when the policy is not attached to the Public role', async () => {
	vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });

	const isAttachedToPublicRole = useIsAttachedToPublicRole(ref('policy-1'));
	await flushPromises();

	expect(isAttachedToPublicRole.value).toBe(false);
});
