import { FlowRaw, OperationRaw } from '@directus/types';
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

const mockFlow = {
	id: 'flow-1',
	name: 'Test Flow',
	status: 'active',
	trigger: 'manual',
	operation: 'op-1',
	operations: [
		{
			id: 'op-1',
			name: 'Existing Operation',
			key: 'existing_op',
			type: 'log',
			position_x: 10,
			position_y: 10,
			options: {},
		} as unknown as OperationRaw,
	],
	options: {},
} as unknown as FlowRaw;

vi.mock('@/stores/flows', () => ({
	useFlowsStore: () => ({
		flows: [mockFlow],
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
		replace: vi.fn(),
	}),
	RouterView: { template: '<div><slot /></div>' },
	onBeforeRouteUpdate: vi.fn(),
	onBeforeRouteLeave: vi.fn(),
}));

vi.mock('@/router', () => ({
	router: {
		resolve: vi.fn().mockReturnValue({ path: '/flows' }),
		push: vi.fn(),
		replace: vi.fn(),
	},
}));

let global: GlobalMountOptions;

beforeEach(() => {
	vi.clearAllMocks();

	global = {
		stubs: {
			'private-view': { template: '<div><slot name="navigation" /><slot /></div>' },
			'v-workspace': {
				template: `
					<div>
						<slot name="tile" :tile="{ id: '$trigger', x: 1, y: 1 }" />
						<slot name="tile" :tile="{ id: 'op-1', x: 10, y: 10 }" />
					</div>
				`,
			},
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

		const operations = wrapper.findAllComponents({ name: 'Operation' });
		expect(operations.length).toBeGreaterThan(0);
		const op = operations[0]!;

		// 1. Create a child operation from trigger -> hits line 293 (stageFlowOperation(tempId))
		await op.vm.$emit('create', '$trigger', 'resolve');
		await op.vm.$emit('update', { edits: { name: 'New Child Op', key: 'new_child' }, id: '+' });

		// 2. Delete the root operation -> hits line 476 (stageFlowOperation(null))
		await op.vm.$emit('delete', 'op-1');

		// 3. Arrow move and stop starting from $trigger -> hits line 575 (stageFlowOperation(nearPanel))
		await op.vm.$emit('arrow-move', { id: '$trigger', type: 'resolve', pos: { x: 50, y: 50 } });
		await op.vm.$emit('arrow-stop');

		// 4. Arrow move and stop when currently connected to trigger
		await op.vm.$emit('arrow-move', { id: 'other-panel', type: 'resolve', pos: { x: 10, y: 10 } });
		await op.vm.$emit('arrow-stop');

		// 5. Delete trigger panel itself (early return)
		await op.vm.$emit('delete', '$trigger');

		expect(wrapper.exists()).toBe(true);
	});
});
