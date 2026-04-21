import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import LicenseRecovery from './license-recovery.vue';
import { i18n } from '@/lang';

const { apiGet, apiPatch, apiPost, notify, routerPush, serverStore, userStore, workflowProps } = vi.hoisted(() => ({
	apiGet: vi.fn(),
	apiPatch: vi.fn(),
	apiPost: vi.fn(),
	notify: vi.fn(),
	routerPush: vi.fn(),
	serverStore: {
		info: {
			version: '11.0.0',
			license_locked: true,
		},
		hydrateInfo: vi.fn().mockResolvedValue(undefined),
	},
	userStore: {
		currentUser: {
			email: 'admin@example.com',
		},
	},
	workflowProps: vi.fn(),
}));

vi.mock('@/api', () => ({
	default: {
		get: apiGet,
		patch: apiPatch,
		post: apiPost,
	},
}));

vi.mock('vue-router', async () => {
	const actual = await vi.importActual<typeof import('vue-router')>('vue-router');
	return {
		...actual,
		useRouter: () => ({ push: routerPush }),
	};
});

vi.mock('@/stores/server', () => ({
	useServerStore: () => serverStore,
}));

vi.mock('@/stores/user', () => ({
	useUserStore: () => userStore,
}));

vi.mock('@/utils/notify', () => ({
	notify,
}));

vi.mock('@unhead/vue', () => ({
	useHead: vi.fn(),
}));

const dialogStub = defineComponent({
	name: 'VDialog',
	props: {
		modelValue: {
			type: Boolean,
			default: true,
		},
	},
	setup(props, { slots }) {
		return () => (props.modelValue ? h('div', { class: 'dialog-stub' }, slots.default?.()) : null);
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
		return () =>
			props.modelValue
				? h('div', { class: 'drawer-stub' }, [
						h('div', { class: 'drawer-actions' }, slots.actions?.()),
						slots.default?.(),
					])
				: null;
	},
});

const actionButtonStub = defineComponent({
	name: 'PrivateViewHeaderBarActionButton',
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['click'],
	template: '<button class="header-action" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
});

const buttonStub = defineComponent({
	name: 'VButton',
	emits: ['click'],
	template: '<button class="page-action" @click="$emit(\'click\')"><slot /></button>',
});

const noticeStub = defineComponent({
	name: 'VNotice',
	setup(_props, { slots }) {
		return () => h('div', { class: 'notice-stub' }, slots.default?.());
	},
});

const keyInputStub = defineComponent({
	name: 'LicenseKeyInput',
	emits: ['update:modelValue', 'can-submit-change'],
	setup(_props, { emit }) {
		return () =>
			h('button', {
				class: 'set-license-key',
				onClick: () => {
					emit('update:modelValue', 'new-license-key');
					emit('can-submit-change', true);
				},
			});
	},
});

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
	emits: ['remediation-applied', 'apply-license-change'],
	setup(props, { emit }) {
		workflowProps(props);
		return () =>
			h('div', { class: 'workflow-stub', 'data-license-key': props.licenseKey ?? '' }, [
				h('button', { class: 'emit-remediation', onClick: () => emit('remediation-applied') }),
				h('button', { class: 'apply-remediated-license', onClick: () => emit('apply-license-change') }),
			]);
	},
});

describe('LicenseRecovery', () => {
	beforeEach(() => {
		apiGet.mockReset();
		apiPatch.mockReset();
		apiPost.mockReset();
		notify.mockReset();
		routerPush.mockReset();
		serverStore.hydrateInfo.mockReset();
		serverStore.hydrateInfo.mockResolvedValue(undefined);
		serverStore.info.license_locked = true;
		workflowProps.mockReset();

		apiGet.mockImplementation((path: string) => {
			if (path === '/server/license') {
				return Promise.resolve({
					data: {
						data: {
							source: 'settings',
							show_license_key_field: true,
							license_status: 'locked',
							license_locked: true,
							license_grace_type: null,
							refresh_interval: 3600,
							plan: 'Team',
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
						},
					},
				});
			}

			throw new Error(`Unexpected GET ${path}`);
		});

		apiPatch.mockResolvedValue({
			data: {
				data: {},
			},
		});

		apiPost.mockResolvedValue({
			data: {
				data: {
					compliant: true,
					target_mode: 'license_change',
					target_entitlements: {
						collections: { limit: 3 },
						seats: { limit: 3 },
						sso_enabled: false,
					},
					sections: [],
				},
			},
		});
	});

	function mountRecovery() {
		return mount(LicenseRecovery, {
			global: {
				plugins: [i18n],
				stubs: {
					VButton: buttonStub,
					PrivateViewHeaderBarActionButton: actionButtonStub,
					VDialog: dialogStub,
					VDrawer: drawerStub,
					VNotice: noticeStub,
					VProgressCircular: true,
					LicenseKeyInput: keyInputStub,
					LicenseDeactivationWorkflow: workflowStub,
				},
				directives: {
					tooltip: {
						mounted() {},
					},
				},
			},
		});
	}

	test('leaves recovery after remediation unlocks the project', async () => {
		serverStore.hydrateInfo.mockImplementation(async () => {
			serverStore.info.license_locked = false;
		});

		const wrapper = mountRecovery();
		await flushPromises();

		await wrapper.get('.emit-remediation').trigger('click');
		await flushPromises();

		expect(serverStore.hydrateInfo).toHaveBeenCalledOnce();
		expect(apiGet).toHaveBeenCalledWith('/server/license');
		expect(apiGet).toHaveBeenCalledTimes(2);
		expect(routerPush).toHaveBeenCalledWith('/settings/license');

		expect(workflowProps).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: 'locked_recovery',
			}),
		);
	});

	test('stays on recovery when remediation refresh still leaves the project locked', async () => {
		const wrapper = mountRecovery();
		await flushPromises();

		await wrapper.get('.emit-remediation').trigger('click');
		await flushPromises();

		expect(serverStore.hydrateInfo).toHaveBeenCalledOnce();
		expect(routerPush).not.toHaveBeenCalled();
	});

	test('renders recovery drawer errors with raw API code and message separately', async () => {
		apiPatch.mockRejectedValue({
			response: {
				data: {
					errors: [
						{
							message: 'License replacement could not be completed.',
							extensions: {
								code: 'LICENSE_CHANGE_BLOCKED',
							},
						},
					],
				},
			},
		});

		const wrapper = mountRecovery();
		await flushPromises();
		await wrapper.get('.page-action').trigger('click');
		await nextTick();
		await wrapper.get('.set-license-key').trigger('click');
		await nextTick();
		await wrapper.findAll('.header-action')[0]!.trigger('click');
		await flushPromises();

		expect(wrapper.text()).toContain('LICENSE_CHANGE_BLOCKED');
		expect(wrapper.text()).toContain('License replacement could not be completed.');
	});

	test('hides license management actions in env offline mode', async () => {
		apiGet.mockImplementation((path: string) => {
			if (path === '/server/license') {
				return Promise.resolve({
					data: {
						data: {
							source: 'env',
							show_license_key_field: false,
							license_status: 'locked',
							license_locked: true,
							license_grace_type: null,
							refresh_interval: 0,
							plan: 'Team',
							expires_at: null,
							renews_at: null,
							entitlements: {
								collections: { limit: 3 },
								seats: { limit: 3 },
								activity_history_days: { limit: 30 },
								revisions_history_days: { limit: 30 },
								sso_enabled: false,
								offline_enabled: true,
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
						},
					},
				});
			}

			throw new Error(`Unexpected GET ${path}`);
		});

		const wrapper = mountRecovery();
		await flushPromises();

		expect(wrapper.find('.page-action').exists()).toBe(false);
	});

	test('hydrates shared server info and leaves recovery after saving a license key that unlocks the project', async () => {
		serverStore.hydrateInfo.mockImplementation(async () => {
			serverStore.info.license_locked = false;
		});

		const wrapper = mountRecovery();
		await flushPromises();
		await wrapper.get('.page-action').trigger('click');
		await nextTick();
		await wrapper.get('.set-license-key').trigger('click');
		await nextTick();
		await wrapper.findAll('.header-action')[0]!.trigger('click');
		await flushPromises();

		expect(apiPost).toHaveBeenCalledWith('/server/license/change-assessment', { license_key: 'new-license-key' });
		expect(apiPatch).toHaveBeenCalledWith('/settings', { license_key: 'new-license-key' });
		expect(serverStore.hydrateInfo).toHaveBeenCalledOnce();
		expect(routerPush).toHaveBeenCalledWith('/settings/license');
	});

	test('opens license_change remediation instead of saving directly when the proposed license is non-compliant', async () => {
		apiPost.mockResolvedValue({
			data: {
				data: {
					compliant: false,
					target_mode: 'license_change',
					target_entitlements: {
						collections: { limit: 2 },
						seats: { limit: 2 },
						sso_enabled: false,
					},
					sections: [{ key: 'seats', required: true }],
				},
			},
		});

		const wrapper = mountRecovery();
		await flushPromises();
		await wrapper.get('.page-action').trigger('click');
		await nextTick();
		await wrapper.get('.set-license-key').trigger('click');
		await nextTick();
		await wrapper.findAll('.header-action')[0]!.trigger('click');
		await flushPromises();

		expect(apiPatch).not.toHaveBeenCalled();
		expect(workflowProps).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'license_change' }));
		expect(wrapper.findAll('.workflow-stub').at(-1)?.attributes('data-license-key')).toBe('new-license-key');
	});

	test('reopens license_change remediation when apply-time save is blocked on the recovery page', async () => {
		apiPatch.mockRejectedValue({
			response: {
				data: {
					errors: [
						{
							extensions: {
								code: 'LICENSE_CHANGE_BLOCKED',
								assessment: {
									compliant: false,
									target_mode: 'license_change',
									target_entitlements: {
										collections: { limit: 2 },
										seats: { limit: 2 },
										sso_enabled: false,
									},
									sections: [{ key: 'seats', required: true }],
								},
							},
						},
					],
				},
			},
		});

		const wrapper = mountRecovery();
		await flushPromises();
		await wrapper.get('.page-action').trigger('click');
		await nextTick();
		await wrapper.get('.set-license-key').trigger('click');
		await nextTick();
		await wrapper.findAll('.header-action')[0]!.trigger('click');
		await flushPromises();

		expect(apiPatch).toHaveBeenCalledWith('/settings', { license_key: 'new-license-key' });
		expect(workflowProps).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'license_change' }));
	});
});
