import { flushPromises } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { nextTick, ref } from 'vue';
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

test('stays unknown when the lookup fails', async () => {
	vi.mocked(api.get).mockRejectedValue(new Error('Network Error'));

	const isAttachedToPublicRole = useIsAttachedToPublicRole(ref('policy-1'));
	await flushPromises();

	expect(isAttachedToPublicRole.value).toBe(null);
});

test('resets on policy change and ignores the previous policy response', async () => {
	let resolveInitial!: (value: unknown) => void;
	let resolveStale!: (value: unknown) => void;
	let resolveCurrent!: (value: unknown) => void;

	vi.mocked(api.get)
		.mockReturnValueOnce(new Promise((resolve) => (resolveInitial = resolve)))
		.mockReturnValueOnce(new Promise((resolve) => (resolveStale = resolve)))
		.mockReturnValueOnce(new Promise((resolve) => (resolveCurrent = resolve)));

	const primaryKey = ref('policy-1');
	const isAttachedToPublicRole = useIsAttachedToPublicRole(primaryKey);

	resolveInitial({ data: { data: [{ id: 'access-1' }] } });
	await flushPromises();

	expect(isAttachedToPublicRole.value).toBe(true);

	primaryKey.value = 'policy-2';
	await nextTick();

	expect(isAttachedToPublicRole.value).toBe(null);

	primaryKey.value = 'policy-3';
	await nextTick();

	resolveCurrent({ data: { data: [] } });
	await flushPromises();
	resolveStale({ data: { data: [{ id: 'access-2' }] } });
	await flushPromises();

	expect(isAttachedToPublicRole.value).toBe(false);
});
