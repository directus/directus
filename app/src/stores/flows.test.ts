import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { useFlowsStore } from './flows';
import { useUserStore } from './user';
import { AppUser } from '@/types/user';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

const mockFlows = [
	{
		name: 'Flow 1',
		status: 'active',
		trigger: 'manual',
		accountability: 'all',
		options: {
			collections: ['a'],
		},
	},
	{
		name: 'Flow 2',
		status: 'inactive',
		trigger: 'event',
		accountability: 'all',
		options: {
			type: 'action',
			scope: ['items.create'],
			collections: ['a'],
		},
	},
	{
		name: 'Flow 3',
		status: 'inactive',
		trigger: 'manual',
		accountability: 'all',
		options: {
			collections: ['a'],
		},
	},
	{
		name: 'Flow 4',
		status: 'active',
		trigger: 'manual',
		accountability: 'all',
		options: {
			collections: ['b'],
		},
	},
];

const mockAdminUser = { admin_access: true } as AppUser;
const mockNonAdminUser = { admin_access: false } as AppUser;

vi.mock('@/api', () => {
	return {
		default: {
			get: (path: string) => {
				if (path === '/flows') {
					return Promise.resolve({
						data: {
							data: mockFlows,
						},
					});
				}

				return Promise.reject(new Error(`Path "${path}" is not mocked in this test`));
			},
		},
	};
});

test('hydrate action for admin', async () => {
	const userStore = useUserStore();
	userStore.currentUser = mockAdminUser;

	const flowsStore = useFlowsStore();
	await flowsStore.hydrate();

	expect(flowsStore.flows).toEqual(mockFlows);
});

test('hydrate action for non-admin', async () => {
	const userStore = useUserStore();
	userStore.currentUser = mockNonAdminUser;

	const flowsStore = useFlowsStore();
	await flowsStore.hydrate();

	expect(flowsStore.flows).toEqual([]);
});

test('dehydrate action resets store', async () => {
	const userStore = useUserStore();
	userStore.currentUser = mockAdminUser;

	const flowsStore = useFlowsStore();
	await flowsStore.hydrate();
	await flowsStore.dehydrate();

	expect(flowsStore.flows).toEqual([]);
});

test('getManualFlowsForCollection action returns active manual flows of specified collection only', async () => {
	const userStore = useUserStore();
	userStore.currentUser = mockAdminUser;

	const flowsStore = useFlowsStore();
	await flowsStore.hydrate();

	const testCollection = 'a';

	expect(flowsStore.getManualFlowsForCollection(testCollection)).toEqual(
		mockFlows.filter(
			(flow) =>
				flow.trigger === 'manual' && flow.status === 'active' && flow.options?.collections?.includes(testCollection),
		),
	);
});
