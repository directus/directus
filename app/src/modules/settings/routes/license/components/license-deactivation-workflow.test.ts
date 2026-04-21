import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import LicenseDeactivationWorkflow from './license-deactivation-workflow.vue';
import { i18n } from '@/lang';

const { apiGet, apiPost } = vi.hoisted(() => ({
	apiGet: vi.fn(),
	apiPost: vi.fn(),
}));

vi.mock('@/api', () => ({
	default: {
		get: apiGet,
		post: apiPost,
	},
}));

const buttonStub = defineComponent({
	name: 'VButton',
	emits: ['click'],
	setup(_props, { emit, slots }) {
		return () =>
			h(
				'button',
				{
					onClick: () => emit('click'),
				},
				slots.default?.(),
			);
	},
});

const checkboxStub = defineComponent({
	name: 'VCheckbox',
	props: {
		label: {
			type: String,
			default: '',
		},
	},
	emits: ['click'],
	setup(props, { emit, slots }) {
		return () =>
			h(
				'button',
				{
					class: 'checkbox-stub',
					onClick: (event: MouseEvent) => emit('click', event),
				},
				[slots.append?.(), props.label],
			);
	},
});

const dialogStub = defineComponent({
	name: 'VDialog',
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { slots }) {
		return () => (props.modelValue ? h('div', slots.default?.()) : null);
	},
});

const noticeStub = defineComponent({
	name: 'VNotice',
	setup(_props, { slots }) {
		return () => h('div', { class: 'notice-stub' }, slots.default?.());
	},
});

function assessmentResponse(overrides: Record<string, unknown> = {}) {
	return {
		compliant: false,
		target_mode: 'fallback',
		target_entitlements: {
			collections: { limit: 50 },
			seats: { limit: 3 },
			sso_enabled: false,
		},
		sections: [
			{
				key: 'seats',
				required: true,
				target: 3,
				current: 5,
				needed_reduction: 2,
				blockers: [],
				candidates: {
					admin_seats: [],
					user_seats: [
						{
							id: 'user-1',
							email: 'john@example.com',
							first_name: 'John',
							last_name: 'Smith',
							avatar: 'avatar-file-id',
							last_access: null,
						},
					],
				},
			},
		],
		...overrides,
	};
}

function licenseResponse(overrides: Record<string, unknown> = {}) {
	return {
		source: 'settings',
		show_license_key_field: true,
		license_status: 'locked',
		license_locked: true,
		license_grace_type: null,
		plan: 'Team',
		refresh_interval: 3600,
		grace_period: 0,
		expires_at: null,
		renews_at: null,
		entitlements: {
			collections: { limit: 3 },
			seats: { limit: 3 },
			activity_history_days: { limit: 30 },
			revisions_history_days: { limit: 30 },
			sso_enabled: false,
			offline_enabled: false,
			custom_policy_rules_enabled: false,
			scheduled_publishing_enabled: false,
			custom_llm_enabled: false,
			analytics_opt_out_enabled: false,
			hide_directus_branding_enabled: true,
		},
		usage: {
			collections: { current: 3 },
			seats: { current: 3, remaining: 0 },
		},
		...overrides,
	};
}

async function mountWorkflow(props: Record<string, unknown>) {
	const wrapper = mount(LicenseDeactivationWorkflow, {
		props: {
			mode: 'manual_deactivation',
			license: null,
			...props,
		},
		global: {
			plugins: [i18n],
			stubs: {
				VButton: buttonStub,
				VCard: true,
				VCardActions: true,
				VCardText: true,
				VCardTitle: true,
				VCheckbox: checkboxStub,
				VChip: true,
				VDialog: dialogStub,
				VAvatar: true,
				VIcon: true,
				VInput: true,
				VImage: true,
				VNotice: noticeStub,
				VProgressCircular: true,
				DrawerItem: defineComponent({
					name: 'DrawerItem',
					props: {
						active: {
							type: Boolean,
							default: false,
						},
						collection: {
							type: String,
							default: '',
						},
						primaryKey: {
							type: [String, Number],
							default: undefined,
						},
						disabled: {
							type: Boolean,
							default: false,
						},
					},
					setup() {
						return () => h('div', { class: 'drawer-item-stub' });
					},
				}),
				InterfaceSystemInputPassword: true,
			},
		},
	});

	await flushPromises();
	await nextTick();

	return wrapper;
}

describe('LicenseDeactivationWorkflow', () => {
	beforeEach(() => {
		apiGet.mockReset();
		apiPost.mockReset();
	});

	test('renders direct deactivate in manual mode when already compliant', async () => {
		apiGet.mockResolvedValue({
			data: {
				data: assessmentResponse({
					compliant: true,
					sections: [],
				}),
			},
		});

		const wrapper = await mountWorkflow({
			mode: 'manual_deactivation',
			canDeactivateLicense: true,
		});

		expect(wrapper.text()).toContain(
			'This project already complies with the fallback limits that will apply after deactivation.',
		);

		expect(wrapper.text()).toContain('Deactivate License');
		expect(wrapper.text()).not.toContain('Deactivate anyway');
	});

	test('renders remediation and deactivate-anyway in manual mode when non-compliant', async () => {
		apiGet.mockResolvedValue({
			data: {
				data: assessmentResponse(),
			},
		});

		const wrapper = await mountWorkflow({
			mode: 'manual_deactivation',
			canDeactivateLicense: true,
		});

		expect(wrapper.text()).toContain('After deactivation, this project will fall back to the limits shown below.');
		expect(wrapper.text()).toContain('Deactivate Selected Items');
		expect(wrapper.text()).toContain('Deactivate anyway');
		expect(wrapper.text()).not.toContain('Deactivate License');
	});

	test('continues in fallback mode when locked recovery is already compliant', async () => {
		apiPost.mockResolvedValue({
			data: {
				data: assessmentResponse({
					compliant: true,
					sections: [],
				}),
			},
		});

		const wrapper = await mountWorkflow({
			mode: 'locked_recovery',
			license: licenseResponse(),
			initialAssessment: assessmentResponse({
				compliant: true,
				sections: [],
			}),
		});

		const action = wrapper.findAll('button').find((button) => button.text().includes('Continue in Fallback Mode'));

		expect(action).toBeDefined();

		await action!.trigger('click');
		await flushPromises();

		expect(apiPost).toHaveBeenCalledWith('/server/license/deactivation', {});
	});

	test('uses the proposed license assessment in license_change mode', async () => {
		apiPost.mockResolvedValue({
			data: {
				data: assessmentResponse({
					target_mode: 'license_change',
				}),
			},
		});

		const wrapper = await mountWorkflow({
			mode: 'license_change',
			licenseKey: 'proposed-key',
		});

		expect(apiPost).toHaveBeenCalledWith('/server/license/change-assessment', {
			license_key: 'proposed-key',
		});

		expect(wrapper.text()).toContain('To apply this license key, bring the project within the limits shown below.');
		expect(wrapper.text()).toContain('Apply Remediation');
	});
});
