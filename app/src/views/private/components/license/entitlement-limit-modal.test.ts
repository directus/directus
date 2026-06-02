import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EntitlementLimitModal from './entitlement-limit-modal.vue';
import { i18n } from '@/lang';

vi.mock('vue-router', () => ({
	useRouter: () => ({
		resolve: ({ name }: { name: string }) => ({ href: `/settings/${name.replace('settings-', '')}` }),
	}),
}));

const global = {
	stubs: {
		VDialog: { template: '<div><slot /></div>' },
		VCard: { template: '<div><slot /></div>' },
		VCardTitle: { template: '<div><slot /></div>' },
		VCardText: { template: '<div><slot /></div>' },
		VCardActions: { template: '<div><slot /></div>' },
		VButton: {
			template: '<button :data-secondary="secondary || undefined" @click="$emit(\'click\')"><slot /></button>',
			props: ['secondary'],
			emits: ['click'],
		},
		VIcon: { template: '<span>{{ name }}</span>', props: ['name'] },
	},
	plugins: [i18n, createTestingPinia({ createSpy: vi.fn })],
};

beforeEach(() => {
	vi.spyOn(window, 'open').mockImplementation(() => null);
});

// --- seats, admin ---

describe('EntitlementLimitModal (type=seats, isAdmin=true)', () => {
	it('shows seats title', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave: vi.fn() },
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('license.seats_limit.title'));
	});

	it('shows admin body copy', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave: vi.fn() },
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('license.seats_limit.body_admin'));
		expect(wrapper.text()).not.toContain(i18n.global.t('license.seats_limit.body_member'));
	});

	it('renders Cancel, Manage Plan, Save buttons in that order', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave: vi.fn() },
			global,
		});

		const buttons = wrapper.findAll('button');
		expect(buttons).toHaveLength(3);
		expect(buttons[0]!.text()).toContain(i18n.global.t('cancel'));
		expect(buttons[1]!.text()).toContain(i18n.global.t('license.manage_plan'));
		expect(buttons[2]!.text()).toContain(i18n.global.t('save'));
	});

	it('Manage Plan is secondary when Save is the primary CTA', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave: vi.fn() },
			global,
		});

		expect(wrapper.findAll('button')[1]!.attributes('data-secondary')).toBe('true');
	});

	it('Manage Plan button shows open_in_new icon', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave: vi.fn() },
			global,
		});

		const buttons = wrapper.findAll('button');
		expect(buttons[1]!.text()).toContain('open_in_new');
	});

	it('Manage Plan opens /settings/license in new tab', async () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave: vi.fn() },
			global,
		});

		await wrapper.findAll('button')[1]!.trigger('click');

		expect(window.open).toHaveBeenCalledWith('/settings/license', '_blank', 'noopener,noreferrer');
	});

	it('Manage Plan emits update:modelValue false', async () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave: vi.fn() },
			global,
		});

		await wrapper.findAll('button')[1]!.trigger('click');

		expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
	});

	it('Save calls onSave and closes modal', async () => {
		const onSave = vi.fn();

		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave },
			global,
		});

		await wrapper.findAll('button')[2]!.trigger('click');

		expect(onSave).toHaveBeenCalledOnce();
		expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
	});

	it('Cancel closes modal without calling onSave', async () => {
		const onSave = vi.fn();

		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: true, onSave },
			global,
		});

		await wrapper.findAll('button')[0]!.trigger('click');

		expect(onSave).not.toHaveBeenCalled();
		expect(wrapper.emitted('update:modelValue')).toEqual([[false]]);
		expect(wrapper.emitted('cancel')).toHaveLength(1);
	});
});

// --- seats, member ---

describe('EntitlementLimitModal (type=seats, isAdmin=false)', () => {
	it('shows seats title', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: false, onSave: vi.fn() },
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('license.seats_limit.title'));
	});

	it('shows member body copy', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: false, onSave: vi.fn() },
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('license.seats_limit.body_member'));
		expect(wrapper.text()).not.toContain(i18n.global.t('license.seats_limit.body_admin'));
	});

	it('renders Cancel and Save buttons only — no Manage Plan', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: false, onSave: vi.fn() },
			global,
		});

		const buttons = wrapper.findAll('button');
		expect(buttons).toHaveLength(2);
		expect(buttons[0]!.text()).toContain(i18n.global.t('cancel'));
		expect(buttons[1]!.text()).toContain(i18n.global.t('save'));
	});

	it('does not open any URL (no Manage Plan button)', () => {
		mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'seats', isAdmin: false, onSave: vi.fn() },
			global,
		});

		expect(window.open).not.toHaveBeenCalled();
	});
});

// --- collections, admin ---

describe('EntitlementLimitModal (type=collections, isAdmin=true)', () => {
	it('shows collections title', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'collections', isAdmin: true },
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('license.collections_limit.title'));
	});

	it('shows collections body copy', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'collections', isAdmin: true },
			global,
		});

		expect(wrapper.text()).toContain(i18n.global.t('license.collections_limit.body'));
	});

	it('renders Cancel and Manage Plan buttons only — no Save', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'collections', isAdmin: true },
			global,
		});

		const buttons = wrapper.findAll('button');
		expect(buttons).toHaveLength(2);
		expect(buttons[0]!.text()).toContain(i18n.global.t('cancel'));
		expect(buttons[1]!.text()).toContain(i18n.global.t('license.manage_plan'));
	});

	it('Manage Plan is the primary CTA when no Save button', () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'collections', isAdmin: true },
			global,
		});

		expect(wrapper.findAll('button')[1]!.attributes('data-secondary')).toBeUndefined();
	});

	it('Manage Plan opens /settings/license in new tab', async () => {
		const wrapper = mount(EntitlementLimitModal, {
			props: { modelValue: true, entitlementKey: 'collections', isAdmin: true },
			global,
		});

		await wrapper.findAll('button')[1]!.trigger('click');

		expect(window.open).toHaveBeenCalledWith('/settings/license', '_blank', 'noopener,noreferrer');
	});
});
