import { type LicenseInfo } from '@directus/sdk';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LicenseLimitModal from './license-limit-modal.vue';
import { i18n } from '@/lang';
import { useLicenseStore } from '@/stores/license';

vi.mock('vue-router', () => ({
	useRouter: () => ({}),
}));

const global = {
	stubs: {
		VDialog: { template: '<div><slot /></div>' },
		VCard: { template: '<div><slot /></div>' },
		VCardTitle: { template: '<div><slot /></div>' },
		VCardText: { template: '<div><slot /></div>' },
		VCardActions: { template: '<div><slot /></div>' },
		VButton: { template: '<button @click="$emit(\'click\')"><slot /></button>', emits: ['click'] },
	},
	plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
};

describe.each([{ type: 'seats' as const }, { type: 'collections' as const }])(
	'LicenseLimitModal (type=$type)',
	({ type }) => {
		let licenseStore: ReturnType<typeof useLicenseStore>;

		beforeEach(() => {
			vi.spyOn(window, 'open').mockImplementation(() => null);

			const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type }, global });
			licenseStore = useLicenseStore();
			wrapper.unmount();
		});

		describe('content based on plan type', () => {
			it('shows manage plan text for non-enterprise plans', () => {
				licenseStore.info = { plan: 'team' } as LicenseInfo;

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type }, global });

				expect(wrapper.text()).toContain(i18n.global.t(`license.${type}_manage_plan_copy`));
				expect(wrapper.text()).toContain(i18n.global.t('license.manage_plan'));
				expect(wrapper.text()).not.toContain(i18n.global.t(`license.${type}_contact_sales_copy`));
			});

			it('shows contact sales text for enterprise plan', () => {
				licenseStore.info = { plan: 'enterprise' } as LicenseInfo;

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type }, global });

				expect(wrapper.text()).toContain(i18n.global.t(`license.${type}_contact_sales_copy`));
				expect(wrapper.text()).toContain(i18n.global.t('license.contact_sales'));
				expect(wrapper.text()).not.toContain(i18n.global.t(`license.${type}_manage_plan_copy`));
			});

			it('shows manage plan text when license info is null', () => {
				licenseStore.info = null;

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type }, global });

				expect(wrapper.text()).toContain(i18n.global.t(`license.${type}_manage_plan_copy`));
			});
		});

		describe('primary action button', () => {
			it('opens /settings/license in new tab for non-enterprise plans', async () => {
				licenseStore.info = { plan: 'team' } as LicenseInfo;

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type }, global });
				const buttons = wrapper.findAll('button');
				// Cancel is index 0, Manage Plan is index 1 (last when no onSave)
				await buttons[buttons.length - 1]!.trigger('click');

				expect(window.open).toHaveBeenCalledWith('/settings/license', '_blank', 'noopener,noreferrer');
			});

			it('opens contact URL for enterprise plan', async () => {
				licenseStore.info = { plan: 'enterprise' } as LicenseInfo;

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type }, global });
				const buttons = wrapper.findAll('button');
				await buttons[buttons.length - 1]!.trigger('click');

				expect(window.open).toHaveBeenCalledWith('https://directus.io/contact', '_blank', 'noopener,noreferrer');
			});

			it('emits update:modelValue false when manage plan action is taken', async () => {
				licenseStore.info = { plan: 'team' } as LicenseInfo;

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type }, global });
				const buttons = wrapper.findAll('button');
				await buttons[buttons.length - 1]!.trigger('click');

				expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
			});
		});

		describe('with onSave prop', () => {
			it('renders a Save button as the last button', () => {
				licenseStore.info = { plan: 'team' } as LicenseInfo;
				const onSave = vi.fn();

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type, onSave }, global });
				const buttons = wrapper.findAll('button');

				// Cancel, Manage Plan, Save
				expect(buttons).toHaveLength(3);
				expect(buttons[2]!.text()).toBe(i18n.global.t('save'));
			});

			it('calls onSave and closes modal when Save is clicked', async () => {
				licenseStore.info = { plan: 'team' } as LicenseInfo;
				const onSave = vi.fn();

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type, onSave }, global });
				const buttons = wrapper.findAll('button');
				await buttons[2]!.trigger('click');

				expect(onSave).toHaveBeenCalledOnce();
				expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
			});

			it('does not call onSave when Manage Plan is clicked', async () => {
				licenseStore.info = { plan: 'team' } as LicenseInfo;
				const onSave = vi.fn();

				const wrapper = mount(LicenseLimitModal, { props: { modelValue: true, type, onSave }, global });
				const buttons = wrapper.findAll('button');
				// Manage Plan is index 1
				await buttons[1]!.trigger('click');

				expect(onSave).not.toHaveBeenCalled();
				expect(window.open).toHaveBeenCalledWith('/settings/license', '_blank', 'noopener,noreferrer');
			});
		});
	},
);
