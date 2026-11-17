import { mount } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { defaultValues } from './form';
import LicenseForm from './license.vue';
import { i18n } from '@/lang';

vi.mock('@/stores/server', () => ({
	useServerStore: () => ({ info: { version: 'test' } }),
}));

const VFormStub = defineComponent({
	props: { modelValue: { type: Object, required: true }, fields: { type: Array, required: true } },
	emits: ['update:modelValue'],
	template: '<div class="form-stub" />',
});

function mountLicenseForm(licenseKey: string | null = null) {
	const modelValue = structuredClone(defaultValues);
	modelValue.license_key = licenseKey;
	modelValue.admin.email = 'admin@example.com';

	const wrapper = mount(LicenseForm, {
		props: {
			modelValue,
			'onUpdate:modelValue': (value) => wrapper.setProps({ modelValue: value }),
		},
		global: { plugins: [i18n], stubs: { VForm: VFormStub, VIcon: true, VButton: true } },
	});

	return wrapper;
}

test('switches between licensing modes without retaining incompatible values or losing admin details', async () => {
	const wrapper = mountLicenseForm('existing-license-key');
	expect(wrapper.find('[value="key"]').attributes('aria-checked')).toBe('true');
	expect(wrapper.vm.canProceed).toBe(true);

	await wrapper.find('[value="core"]').trigger('click');
	expect(wrapper.find('[value="core"]').attributes('aria-checked')).toBe('true');
	expect(wrapper.props('modelValue')?.license_key).toBeNull();
	expect(wrapper.props('modelValue')?.admin.email).toBe('admin@example.com');
	expect(wrapper.vm.canProceed).toBe(false);

	wrapper.findComponent(VFormStub).vm.$emit('update:modelValue', { project_usage: 'commercial', org_name: 'Example' });
	await nextTick();
	expect(wrapper.vm.canProceed).toBe(true);
	await wrapper.find('[value="key"]').trigger('click');
	expect(wrapper.find('[value="key"]').attributes('aria-checked')).toBe('true');
	expect(wrapper.props('modelValue')?.owner.project_usage).toBeNull();
	expect(wrapper.props('modelValue')?.owner.org_name).toBeNull();
	expect(wrapper.vm.canProceed).toBe(false);
});
