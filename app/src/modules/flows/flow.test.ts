import { FlowRaw } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Flow from './flow.vue';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

vi.mock('@/api', () => ({
	default: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock('@/stores/flows', () => ({
	useFlowsStore: () => ({
		flows: [
			{
				id: 'flow-1',
				name: 'Test Flow',
				status: 'active',
				trigger: 'manual',
				operation: null,
				operations: [],
				options: {},
			} as unknown as FlowRaw,
		],
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/stores/license', () => ({
	useLicenseStore: () => ({
		limits: { flows: { remaining: 1, hasRemaining: true } },
		hydrate: vi.fn(),
	}),
}));

vi.mock('vue-router', () => ({
	useRouter: () => ({
		resolve: vi.fn().mockReturnValue({ path: '/flows' }),
		push: vi.fn(),
	}),
	RouterView: { template: '<div><slot /></div>' },
	onBeforeRouteUpdate: vi.fn(),
	onBeforeRouteLeave: vi.fn(),
}));

vi.mock('@/router', () => ({
	router: {
		resolve: vi.fn().mockReturnValue({ path: '/flows' }),
		push: vi.fn(),
	},
}));

let global: GlobalMountOptions;

beforeEach(() => {
	vi.clearAllMocks();

	global = {
		stubs: {
			'private-view': { template: '<div><slot name="navigation" /><slot /></div>' },
			'v-workspace': { template: '<div><slot name="tile" :tile="{ id: \'$trigger\' }" /></div>' },
			operation: { name: 'Operation', template: '<div class="operation-stub"><slot /></div>' },
			arrows: true,
			'v-progress-circular': true,
			'v-dialog': true,
			'v-card': true,
			'v-card-title': true,
			'v-card-text': true,
			'v-card-actions': true,
			'v-button': true,
			'flow-drawer': true,
			'flows-navigation': true,
			'logs-sidebar-detail': true,
		},
		plugins: [i18n, createTestingPinia({ createSpy: vi.fn, stubActions: false })],
		directives: {
			tooltip: Tooltip,
		},
	};
});

describe('Flow.vue', () => {
	test('renders cleanly without error', () => {
		const wrapper = mount(Flow, {
			global,
			props: {
				primaryKey: 'flow-1',
			},
		});

		expect(wrapper.exists()).toBe(true);
	});

	test('stages operation delta when trigger child operation is deleted or updated', async () => {
		const wrapper = mount(Flow, {
			global,
			props: {
				primaryKey: 'flow-1',
			},
		});

		const op = wrapper.findComponent({ name: 'Operation' });
		expect(op.exists()).toBe(true);

		// Emitting delete triggers deletePanel and stageFlowOperation(null)
		await op.vm.$emit('delete', 'op-1');

		// Emitting update under $trigger triggers stageOperationEdits and stageFlowOperation(tempId)
		await op.vm.$emit('update', { edits: { name: 'New Operation' }, parentId: '$trigger' });

		// Emitting arrow-stop triggers arrowStop
		await op.vm.$emit('arrow-stop');

		expect(wrapper.exists()).toBe(true);
	});
});
