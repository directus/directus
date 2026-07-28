import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import SetupForm from './form.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const i18n = createI18n({ legacy: false });
vi.spyOn(i18n.global, 't').mockImplementation((key: any) => key);

vi.mock('@/stores/relations', () => ({
	useRelationsStore: () => ({ getRelationsForField: () => [] }),
}));

vi.mock('@/directives/markdown', () => ({ default: {} }));

/** Stub for VForm that exposes a method to trigger update:modelValue from tests */
const VFormStub = defineComponent({
	props: ['modelValue', 'fields', 'initialValues', 'validationErrors', 'showValidationErrors', 'disabledMenu'],
	emits: ['update:modelValue'],
	setup(_, { emit }) {
		return { triggerUpdate: (val: any) => emit('update:modelValue', val) };
	},
	render: () => h('div', { class: 'v-form-stub' }),
});

function makeGlobal(): GlobalMountOptions {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			initialState: { serverStore: { info: { version: '1', project: {} } } },
		}),
	);

	return {
		plugins: [i18n],
		stubs: {
			VForm: VFormStub,
			VCheckbox: { template: '<label><slot /></label>' },
			VNotice: { template: '<div><slot /></div>' },
			I18nT: { template: '<span><slot /></span>' },
		},
	};
}

test('preserves license when VForm emits a partial update without the license field', async () => {
	const modelValue = {
		admin: {
			email: 'alice@example.com',
			password: 'secret',
			first_name: 'Alice',
			last_name: 'Smith',
		},
		password_confirm: 'secret',
		license: true,
		license_key: null,
		owner: {
			project_owner: null,
			project_usage: null,
			org_name: null,
			product_updates: false,
		},
	};

	const wrapper = mount(SetupForm, {
		props: {
			modelValue,
			'onUpdate:modelValue': (val: any) => wrapper.setProps({ modelValue: val }),
		},
		global: makeGlobal(),
	});

	// Simulate VForm emitting a partial update that lacks the license field
	const vForm = wrapper.findComponent(VFormStub);

	await vForm.vm.triggerUpdate({
		first_name: 'Bob',
		last_name: 'Smith',
		project_owner: 'alice@example.com',
		password: 'secret',
		password_confirm: 'secret',
	});

	const emitted = wrapper.emitted('update:modelValue');
	const lastValue = emitted?.[emitted.length - 1]?.[0] as any;

	expect(lastValue?.license).toBe(true);
});

test('preserves product_updates when VForm emits a partial update', async () => {
	const modelValue = {
		admin: {
			email: 'alice@example.com',
			password: 'secret',
			first_name: 'Alice',
			last_name: 'Smith',
		},
		password_confirm: 'secret',
		license: false,
		license_key: null,
		owner: {
			project_owner: null,
			project_usage: null,
			org_name: null,
			product_updates: true,
		},
	};

	const wrapper = mount(SetupForm, {
		props: {
			modelValue,
			'onUpdate:modelValue': (val: any) => wrapper.setProps({ modelValue: val }),
		},
		global: makeGlobal(),
	});

	const vForm = wrapper.findComponent(VFormStub);

	await vForm.vm.triggerUpdate({
		first_name: 'Alice',
		last_name: 'Smith',
		project_owner: 'alice@example.com',
		password: 'secret',
		password_confirm: 'secret',
	});

	const emitted = wrapper.emitted('update:modelValue');
	const lastValue = emitted?.[emitted.length - 1]?.[0] as any;

	expect(lastValue?.owner?.product_updates).toBe(true);
});
