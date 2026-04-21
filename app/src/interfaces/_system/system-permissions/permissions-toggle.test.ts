import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createI18n } from 'vue-i18n';
import PermissionsToggle from './permissions-toggle.vue';

const i18n = createI18n({
	legacy: false,
	locale: 'en',
	messages: {
		en: {
			read: 'Read',
			all_access: 'All Access',
			no_access: 'No Access',
			use_custom: 'Use Custom',
			required_for_app_access: 'Required for app access',
			permissionsLevel: {
				all: '{action} all',
				none: '{action} none',
				custom: '{action} custom',
			},
		},
	},
});

const VChipStub = defineComponent({
	inheritAttrs: false,
	setup(_props, { attrs, slots }) {
		return () => h('button', { ...attrs, 'data-test': 'chip' }, slots.default?.());
	},
});

const VMenuStub = defineComponent({
	setup(_props, { slots }) {
		return () =>
			h('div', [
				slots.activator?.({
					toggle: vi.fn(),
					active: false,
				}),
				slots.default?.(),
			]);
	},
});

const VListItemStub = defineComponent({
	props: {
		disabled: Boolean,
		clickable: Boolean,
	},
	emits: ['click'],
	setup(props, { slots, emit }) {
		return () =>
			h(
				'button',
				{
					'data-test': 'list-item',
					disabled: props.disabled,
					onClick: () => emit('click'),
				},
				slots.default?.(),
			);
	},
});

const VIconStub = defineComponent({
	props: {
		name: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		return () => h('i', { 'data-test': 'icon', 'data-name': props.name });
	},
});

function mountComponent(customPolicyRulesEnabled: boolean, permission?: Record<string, unknown>) {
	return mount(PermissionsToggle, {
		props: {
			collection: {
				collection: 'articles',
				meta: null,
				schema: null,
			} as any,
			action: 'read',
			permission: permission as any,
		},
		global: {
			plugins: [
				i18n,
				createTestingPinia({
					createSpy: vi.fn,
					initialState: {
						serverStore: {
							info: {
								license: {
									custom_policy_rules_enabled: customPolicyRulesEnabled,
								},
							},
						},
					},
				}),
			],
			stubs: {
				VChip: VChipStub,
				VDivider: true,
				VIcon: VIconStub,
				VListItemContent: defineComponent({
					setup(_props, { slots }) {
						return () => h('span', slots.default?.());
					},
				}),
				VListItemIcon: defineComponent({
					setup(_props, { slots }) {
						return () => h('span', slots.default?.());
					},
				}),
				VListItem: VListItemStub,
				VList: defineComponent({
					setup(_props, { slots }) {
						return () => h('div', slots.default?.());
					},
				}),
				VMenu: VMenuStub,
				VProgressCircular: true,
			},
			directives: {
				tooltip: () => {},
			},
		},
	});
}

describe('PermissionsToggle', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it('emits edit when custom rules are enabled', async () => {
		const wrapper = mountComponent(true, {
			fields: ['*'],
			presets: null,
			permissions: null,
			validation: null,
		});

		await wrapper.findAll('[data-test="list-item"]')[2]!.trigger('click');

		expect(wrapper.emitted('edit')).toHaveLength(1);
		expect(wrapper.findAll('[data-test="icon"]').at(-1)?.attributes('data-name')).toBe('launch');
	});

	it('disables custom edit and shows the diamond icon when custom rules are disabled', async () => {
		const wrapper = mountComponent(false, {
			fields: ['*'],
			presets: null,
			permissions: null,
			validation: null,
		});

		const customAction = wrapper.findAll('[data-test="list-item"]')[2]!;

		expect(customAction.attributes('disabled')).toBeDefined();
		expect(wrapper.findAll('[data-test="icon"]').at(-1)?.attributes('data-name')).toBe('diamond');

		await customAction.trigger('click');

		expect(wrapper.emitted('edit')).toBeUndefined();
	});

	it('marks presets-only permissions as custom', () => {
		const wrapper = mountComponent(true, {
			fields: ['*'],
			presets: { status: 'draft' },
			permissions: null,
			validation: null,
		});

		expect(wrapper.get('[data-test="chip"]').classes()).toContain('custom');
	});

	it('treats wildcard fields with no other custom state as all access', () => {
		const wrapper = mountComponent(true, {
			fields: ['*', 'id'],
			presets: null,
			permissions: null,
			validation: null,
		});

		expect(wrapper.get('[data-test="chip"]').classes()).toContain('all');
	});
});
