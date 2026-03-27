import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vite-plus/test';
import { defineComponent } from 'vue';
import OperationDetail from './operation-detail.vue';
import { i18n } from '@/lang';

const { mockOperation } = vi.hoisted(() => ({
	mockOperation: {
		id: 'test-operation',
		name: 'Test Operation',
		icon: 'bolt',
		description: 'Custom operation',
		options: {},
	},
}));

vi.mock('@/composables/use-dialog-route', async () => {
	const { ref } = await import('vue');

	return {
		useDialogRoute: () => ref(true),
	};
});

vi.mock('@/composables/use-extension', async () => {
	const { ref } = await import('vue');

	return {
		useExtension: () => ref(mockOperation),
	};
});

vi.mock('@/extensions', async () => {
	const { ref } = await import('vue');

	return {
		useExtensions: () => ({
			operations: ref([mockOperation]),
		}),
	};
});

vi.mock('@/views/private', async () => {
	const { defineComponent } = await import('vue');

	return {
		PrivateViewHeaderBarActionButton: defineComponent({
			name: 'PrivateViewHeaderBarActionButton',
			emits: ['click'],
			template: '<button class="header-apply" @click="$emit(\'click\')">save</button>',
		}),
	};
});

const CustomOperationOptions = defineComponent({
	name: 'OperationOptionsTestOperation',
	props: {
		value: {
			type: Object,
			default: () => ({}),
		},
	},
	emits: ['input'],
	template: `
		<div>
			<span class="current-endpoint">{{ value?.endpoint ?? '' }}</span>
			<button
				class="emit-update"
				@click="$emit('input', { endpoint: 'deals', action: 'create' })"
			>
				update
			</button>
		</div>
	`,
});

const VDrawerStub = defineComponent({
	name: 'VDrawer',
	emits: ['apply', 'cancel'],
	template: `
		<div>
			<slot name="actions" />
			<slot />
			<button class="drawer-apply" @click="$emit('apply')">apply</button>
		</div>
	`,
});

describe('OperationDetail', () => {
	it('persists changes from custom operation options components', async () => {
		const wrapper = mount(OperationDetail, {
			props: {
				primaryKey: 'flow-1',
				operationId: 'operation-1',
				flow: { name: 'Test Flow' } as any,
				operation: {
					type: 'test-operation',
					key: 'test_operation',
					name: 'Test Operation',
					options: {
						endpoint: 'contacts',
						action: 'read',
					},
				},
				existingOperationKeys: [],
			},
			global: {
				plugins: [i18n],
				components: {
					'operation-options-test-operation': CustomOperationOptions,
				},
				stubs: {
					ExtensionOptions: true,
					VDivider: true,
					VDrawer: VDrawerStub,
					VFancySelect: true,
					VIcon: true,
					VInput: true,
					VNotice: true,
				},
			},
		});

		expect(wrapper.find('.current-endpoint').text()).toBe('contacts');

		await wrapper.find('.emit-update').trigger('click');
		await wrapper.find('.drawer-apply').trigger('click');

		expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(
			expect.objectContaining({
				options: {
					endpoint: 'deals',
					action: 'create',
				},
			}),
		);
	});
});
