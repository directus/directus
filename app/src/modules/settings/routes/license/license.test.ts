import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import LicenseView from './license.vue';
import { i18n } from '@/lang';

const {
	apiDelete,
	apiGet,
	apiPost,
	notify,
	serverStore,
	settingsStore,
	userStore,
	checkProposedKey,
	applyProposedKey,
} = vi.hoisted(() => ({
	apiDelete: vi.fn(),
	apiGet: vi.fn(),
	apiPost: vi.fn(),
	notify: vi.fn(),
	serverStore: {
		info: {
			version: '10.0.0',
			license_locked: false,
		},
		hydrateInfo: vi.fn(),
	},
	settingsStore: {
		hydrate: vi.fn().mockResolvedValue(undefined),
	},
	userStore: {
		currentUser: {
			email: 'admin@example.com',
		},
		isAdmin: true,
	},
	checkProposedKey: vi.fn(),
	applyProposedKey: vi.fn(),
}));

vi.mock('@/api', () => ({
	default: {
		delete: apiDelete,
		get: apiGet,
		post: apiPost,
	},
}));

vi.mock('@/composables/use-proposed-license-change', () => ({
	useProposedLicenseChange: () => ({
		checkProposedKey,
		applyProposedKey,
	}),
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => serverStore,
}));

vi.mock('@/stores/settings', () => ({
	useSettingsStore: () => settingsStore,
}));

vi.mock('@/stores/user', () => ({
	useUserStore: () => userStore,
}));

vi.mock('@/utils/notify', () => ({
	notify,
}));

const workflowStub = defineComponent({
	name: 'LicenseDeactivationWorkflow',
	props: {
		mode: {
			type: String,
			required: true,
		},
		licenseKey: {
			type: String,
			default: null,
		},
	},
	emits: ['deactivate-license', 'deactivate-anyway', 'apply-license-change', 'remediation-applied'],
	setup(props, { emit }) {
		return () =>
			h('div', { class: 'workflow-stub', 'data-license-key': props.licenseKey ?? '' }, [
				h('div', { class: 'workflow-mode' }, props.mode),
				h(
					'button',
					{
						class: 'emit-direct',
						onClick: () => emit('deactivate-license'),
					},
					'direct',
				),
				h(
					'button',
					{
						class: 'emit-anyway',
						onClick: () => emit('deactivate-anyway'),
					},
					'anyway',
				),
				h(
					'button',
					{
						class: 'emit-apply-license-change',
						onClick: () => emit('apply-license-change'),
					},
					'apply-license-change',
				),
				h(
					'button',
					{
						class: 'emit-remediation',
						onClick: () =>
							emit('remediation-applied', {
								compliant: true,
								target_mode: 'fallback',
								target_entitlements: {
									collections: { limit: 50 },
									seats: { limit: 3 },
									sso_enabled: false,
								},
								sections: [],
							}),
					},
					'emit-remediation',
				),
			]);
	},
});

const dangerZoneStub = defineComponent({
	name: 'LicenseDangerZone',
	emits: ['deactivate'],
	setup(_props, { emit }) {
		return () =>
			h(
				'button',
				{
					class: 'open-deactivation-dialog',
					onClick: () => emit('deactivate'),
				},
				'open',
			);
	},
});

const addonsSectionStub = defineComponent({
	name: 'LicenseAddonsSection',
	setup() {
		return () => h('div', { class: 'addons-section-stub' });
	},
});

const planSectionStub = defineComponent({
	name: 'LicensePlanSection',
	emits: ['manage-license'],
	setup(_props, { emit }) {
		return () =>
			h(
				'button',
				{
					class: 'open-license-drawer',
					onClick: () => emit('manage-license'),
				},
				'open-license-drawer',
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
	emits: ['update:modelValue'],
	setup(props, { slots, emit }) {
		return () =>
			props.modelValue
				? h('div', [
						h(
							'button',
							{
								class: 'close-dialog',
								onClick: () => emit('update:modelValue', false),
							},
							'close-dialog',
						),
						slots.default?.(),
					])
				: null;
	},
});

const drawerStub = defineComponent({
	name: 'VDrawer',
	props: {
		modelValue: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { slots }) {
		return () => (props.modelValue ? h('div', { class: 'drawer-stub' }, [slots.actions?.(), slots.default?.()]) : null);
	},
});

const keyInputStub = defineComponent({
	name: 'LicenseKeyInput',
	emits: ['update:modelValue', 'can-submit-change'],
	template:
		"<button class=\"set-license-key\" @click=\"$emit('update:modelValue', 'new-license-key'); $emit('can-submit-change', true)\">set</button>",
});

const actionButtonStub = defineComponent({
	name: 'PrivateViewHeaderBarActionButton',
	emits: ['click'],
	template: '<button class="header-action" @click="$emit(\'click\')"><slot /></button>',
});

const buttonStub = defineComponent({
	name: 'VButton',
	emits: ['click'],
	template: '<button class="page-action" @click="$emit(\'click\')"><slot /></button>',
});

function licenseResponse(overrides: Record<string, unknown> = {}) {
	return {
		source: 'settings',
		show_license_key_field: true,
		license_status: 'active',
		license_locked: false,
		license_grace_type: null,
		status: 'active',
		plan: 'Team',
		refresh_interval: 3600,
		grace_period: 0,
		expires_at: null,
		renews_at: null,
		entitlements: {
			collections: { limit: 50 },
			seats: { limit: 5 },
			activity_history_days: { limit: 30 },
			revisions_history_days: { limit: 30 },
			sso_enabled: true,
			offline_enabled: false,
			custom_policy_rules_enabled: true,
			scheduled_publishing_enabled: false,
			custom_llm_enabled: true,
			analytics_opt_out_enabled: true,
			hide_directus_branding_enabled: true,
		},
		usage: {
			collections: { current: 1 },
			seats: { current: 1, remaining: 4 },
		},
		...overrides,
	};
}

async function mountView() {
	const wrapper = mount(LicenseView, {
		global: {
			plugins: [i18n],
			directives: {
				tooltip: () => undefined,
			},
			stubs: {
				PrivateView: defineComponent({
					setup(_props, { slots }) {
						return () => h('div', slots.default?.());
					},
				}),
				VBreadcrumb: true,
				VNotice: true,
				VProgressCircular: true,
				VInput: true,
				VIcon: true,
				SettingsNavigation: true,
				LicenseBanners: true,
				LicenseUsageGrid: true,
				LicensePlanSection: planSectionStub,
				LicenseAddonsSection: addonsSectionStub,
				LicenseDangerZone: dangerZoneStub,
				LicenseDeactivationWorkflow: workflowStub,
				VDialog: dialogStub,
				VDrawer: drawerStub,
				LicenseKeyInput: keyInputStub,
				PrivateViewHeaderBarActionButton: actionButtonStub,
				VButton: buttonStub,
			},
		},
	});

	await flushPromises();
	await nextTick();

	return wrapper;
}

describe('license workflow integration', () => {
	beforeEach(() => {
		apiGet.mockReset();
		apiPost.mockReset();
		notify.mockReset();
		serverStore.hydrateInfo.mockReset();
		settingsStore.hydrate.mockReset();
		checkProposedKey.mockReset();
		applyProposedKey.mockReset();

		serverStore.hydrateInfo.mockResolvedValue(undefined);
		settingsStore.hydrate.mockResolvedValue(undefined);

		checkProposedKey.mockResolvedValue({
			compliant: true,
			sections: [],
			target_entitlements: {},
			target_mode: 'license_change',
		});

		applyProposedKey.mockResolvedValue({ status: 'applied' });

		apiGet.mockImplementation((path: string) => {
			if (path === '/server/license') {
				return Promise.resolve({
					data: {
						data: licenseResponse(),
					},
				});
			}

			if (path === '/server/license/addons') {
				return Promise.reject(new Error('addons unavailable'));
			}

			if (path === '/server/license/deactivation') {
				return Promise.resolve({
					data: {
						data: {
							compliant: false,
							target_mode: 'fallback',
							target_entitlements: {
								collections: { limit: 50 },
								seats: { limit: 3 },
								sso_enabled: false,
							},
							sections: [],
						},
					},
				});
			}

			throw new Error(`Unexpected GET ${path}`);
		});

		apiPost.mockImplementation((path: string) => {
			if (path === '/server/license/deactivate') {
				return Promise.resolve({ data: { data: {} } });
			}

			throw new Error(`Unexpected POST ${path}`);
		});
	});

	test('opens remediation dialog when proposed license is non-compliant', async () => {
		checkProposedKey.mockResolvedValue({
			compliant: false,
			target_mode: 'license_change',
			target_entitlements: {
				collections: { limit: 10 },
				seats: { limit: 1 },
				sso_enabled: false,
			},
			sections: [],
		});

		const wrapper = await mountView();

		await wrapper.find('.open-license-drawer').trigger('click');
		await wrapper.find('.set-license-key').trigger('click');
		await wrapper.find('.header-action').trigger('click');
		await flushPromises();

		expect(checkProposedKey).toHaveBeenCalledWith('new-license-key');
		expect(wrapper.text()).toContain('license_change');
		expect(wrapper.find('[data-license-key="new-license-key"]').exists()).toBe(true);
	});

	test('applies proposed license from remediation dialog', async () => {
		checkProposedKey.mockResolvedValue({
			compliant: false,
			target_mode: 'license_change',
			target_entitlements: {
				collections: { limit: 10 },
				seats: { limit: 1 },
				sso_enabled: false,
			},
			sections: [],
		});

		const wrapper = await mountView();

		await wrapper.find('.open-license-drawer').trigger('click');
		await wrapper.find('.set-license-key').trigger('click');
		await wrapper.find('.header-action').trigger('click');
		await flushPromises();

		await wrapper.find('.emit-apply-license-change').trigger('click');
		await flushPromises();

		expect(applyProposedKey).toHaveBeenCalledWith('new-license-key');
		expect(notify).toHaveBeenCalledWith({ title: 'License key was saved successfully.' });
	});

	test('opens manual deactivation workflow for non-compliant projects', async () => {
		const wrapper = await mountView();

		await wrapper.find('.open-deactivation-dialog').trigger('click');
		await flushPromises();

		expect(apiGet).toHaveBeenCalledWith('/server/license/deactivation');
		expect(wrapper.text()).toContain('manual_deactivation');
	});

	test('opens direct confirmation when project already complies for deactivation', async () => {
		apiGet.mockImplementation((path: string) => {
			if (path === '/server/license') {
				return Promise.resolve({
					data: {
						data: licenseResponse(),
					},
				});
			}

			if (path === '/server/license/addons') {
				return Promise.reject(new Error('addons unavailable'));
			}

			if (path === '/server/license/deactivation') {
				return Promise.resolve({
					data: {
						data: {
							compliant: true,
							target_mode: 'fallback',
							target_entitlements: {
								collections: { limit: 50 },
								seats: { limit: 3 },
								sso_enabled: false,
							},
							sections: [],
						},
					},
				});
			}

			throw new Error(`Unexpected GET ${path}`);
		});

		const wrapper = await mountView();

		await wrapper.find('.open-deactivation-dialog').trigger('click');
		await flushPromises();

		expect(wrapper.text()).toContain('Deactivate License');

		const deactivateButtons = wrapper.findAll('.page-action');
		const deactivateButton = deactivateButtons.find((button) => button.text().includes('Deactivate License'));

		expect(deactivateButton).toBeDefined();

		await deactivateButton!.trigger('click');
		await flushPromises();

		expect(apiPost).toHaveBeenCalledWith('/server/license/deactivate');
		expect(notify).toHaveBeenCalledWith({ title: 'License was deactivated successfully.' });
	});
});
