import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import LicenseGracePopup from './license-grace-popup.vue';
import { i18n } from '@/lang';

const { apiGet, notify, cookiesSet, serverStore, settingsStore, userStore, checkProposedKey, applyProposedKey } =
	vi.hoisted(() => ({
		apiGet: vi.fn(),
		notify: vi.fn(),
		cookiesSet: vi.fn(),
		serverStore: {
			info: {
				version: '11.0.0',
			},
			hydrateInfo: vi.fn().mockResolvedValue(undefined),
		},
		settingsStore: {
			hydrate: vi.fn().mockResolvedValue(undefined),
		},
		userStore: {
			currentUser: {
				email: 'admin@example.com',
			},
		},
		checkProposedKey: vi.fn(),
		applyProposedKey: vi.fn(),
	}));

vi.mock('@/api', () => ({
	default: {
		get: apiGet,
	},
}));

vi.mock('@vueuse/integrations/useCookies', () => ({
	useCookies: () => ({
		get: vi.fn(),
		set: cookiesSet,
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

vi.mock('@/composables/use-proposed-license-change', () => ({
	useProposedLicenseChange: () => ({
		checkProposedKey,
		applyProposedKey,
	}),
}));

const dialogStub = defineComponent({
	name: 'VDialog',
	props: {
		modelValue: {
			type: Boolean,
			default: true,
		},
		persistent: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { slots, emit }) {
		return () =>
			props.modelValue
				? h('div', { class: 'dialog-stub' }, [
						h(
							'button',
							{
								class: 'overlay-close',
								onClick: () => {
									if (!props.persistent) emit('update:modelValue', false);
								},
							},
							'overlay-close',
						),
						slots.default?.(),
					])
				: null;
	},
});

const buttonStub = defineComponent({
	name: 'VButton',
	props: {
		disabled: {
			type: Boolean,
			default: false,
		},
		href: {
			type: String,
			default: undefined,
		},
	},
	emits: ['click'],
	setup(props, { emit, slots }) {
		return () =>
			h(
				'button',
				{
					class: props.href ? 'link-button' : 'action-button',
					disabled: props.disabled,
					'data-href': props.href,
					onClick: () => emit('click'),
				},
				slots.default?.(),
			);
	},
});

const licenseKeyInputStub = defineComponent({
	name: 'LicenseKeyInput',
	emits: ['update:modelValue', 'can-submit-change'],
	setup(_props, { emit }) {
		return () =>
			h('div', [
				h(
					'button',
					{
						class: 'set-valid-key',
						onClick: () => {
							emit('update:modelValue', 'proposed-key');
							emit('can-submit-change', true);
						},
					},
					'set-valid-key',
				),
			]);
	},
});

const workflowProps = vi.fn();

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
	emits: ['apply-license-change'],
	setup(props, { emit }) {
		workflowProps(props);
		return () =>
			h('div', { class: 'workflow-stub', 'data-license-key': props.licenseKey ?? '' }, [
				h('div', { class: 'workflow-mode' }, props.mode),
				h(
					'button',
					{
						class: 'apply-remediated-license',
						onClick: () => emit('apply-license-change'),
					},
					'apply-remediated-license',
				),
			]);
	},
});

const passthroughStub = defineComponent({
	setup(_props, { slots }) {
		return () => h('div', slots.default?.());
	},
});

function mountPopup() {
	return mount(LicenseGracePopup, {
		global: {
			plugins: [i18n],
			stubs: {
				VDialog: dialogStub,
				VCard: passthroughStub,
				VCardTitle: passthroughStub,
				VCardText: passthroughStub,
				VCardActions: passthroughStub,
				VButton: buttonStub,
				VIcon: true,
				VNotice: true,
				I18nT: defineComponent({
					props: {
						tag: {
							type: String,
							default: 'span',
						},
					},
					setup(props, { slots }) {
						return () => h(props.tag, slots.default?.());
					},
				}),
				LicenseKeyInput: licenseKeyInputStub,
				LicenseDeactivationWorkflow: workflowStub,
			},
		},
	});
}

describe('LicenseGracePopup', () => {
	beforeEach(() => {
		apiGet.mockReset();
		notify.mockReset();
		cookiesSet.mockReset();
		serverStore.hydrateInfo.mockClear();
		settingsStore.hydrate.mockClear();
		checkProposedKey.mockReset();
		applyProposedKey.mockReset();
		workflowProps.mockReset();
	});

	test('shows get-license and skip before a valid key is entered', async () => {
		const wrapper = mountPopup();
		await nextTick();

		expect(wrapper.text()).toContain('Have a license key?');
		expect(wrapper.text()).toContain('Get a License Key');
		expect(wrapper.text()).toContain('Skip');
		expect(wrapper.text()).not.toContain('Apply License');
	});

	test('applies a compliant key and rehydrates shared state', async () => {
		checkProposedKey.mockResolvedValue({ compliant: true });
		applyProposedKey.mockResolvedValue({ status: 'applied' });

		const wrapper = mountPopup();
		await wrapper.get('.set-valid-key').trigger('click');
		await nextTick();
		await wrapper.get('.action-button').trigger('click');
		await flushPromises();

		expect(checkProposedKey).toHaveBeenCalledWith('proposed-key');
		expect(applyProposedKey).toHaveBeenCalledWith('proposed-key');
		expect(serverStore.hydrateInfo).toHaveBeenCalledOnce();
		expect(settingsStore.hydrate).toHaveBeenCalledOnce();
		expect(notify).toHaveBeenCalledWith({ title: 'License key was saved successfully.' });
	});

	test('opens remediation workflow when the proposed key is blocked', async () => {
		apiGet.mockResolvedValue({
			data: {
				data: {
					source: 'settings',
					show_license_key_field: true,
				},
			},
		});

		checkProposedKey.mockResolvedValue({
			compliant: false,
			target_mode: 'license_change',
			target_entitlements: {
				collections: { limit: 2 },
				seats: { limit: 2 },
				sso_enabled: false,
			},
			sections: [{ key: 'seats', required: true }],
		});

		const wrapper = mountPopup();
		await wrapper.get('.set-valid-key').trigger('click');
		await nextTick();
		await wrapper.get('.action-button').trigger('click');
		await flushPromises();

		expect(apiGet).toHaveBeenCalledWith('/server/license');
		expect(workflowProps).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'license_change' }));
		expect(wrapper.find('.workflow-stub').attributes('data-license-key')).toBe('proposed-key');
	});

	test('reopens remediation workflow when apply is blocked after a compliant check', async () => {
		apiGet.mockResolvedValue({
			data: {
				data: {
					source: 'settings',
					show_license_key_field: true,
				},
			},
		});

		checkProposedKey.mockResolvedValue({ compliant: true });
		applyProposedKey.mockResolvedValue({
			status: 'blocked',
			assessment: {
				compliant: false,
				target_mode: 'license_change',
				target_entitlements: {
					collections: { limit: 2 },
					seats: { limit: 2 },
					sso_enabled: false,
				},
				sections: [{ key: 'collections', required: true }],
			},
		});

		const wrapper = mountPopup();
		await wrapper.get('.set-valid-key').trigger('click');
		await nextTick();
		await wrapper.get('.action-button').trigger('click');
		await flushPromises();

		expect(checkProposedKey).toHaveBeenCalledWith('proposed-key');
		expect(applyProposedKey).toHaveBeenCalledWith('proposed-key');
		expect(apiGet).toHaveBeenCalledWith('/server/license');
		expect(workflowProps).toHaveBeenLastCalledWith(expect.objectContaining({ mode: 'license_change' }));
		expect(wrapper.find('.workflow-stub').attributes('data-license-key')).toBe('proposed-key');
	});

	test('skip sets the session cookie', async () => {
		const wrapper = mountPopup();
		await wrapper.get('.action-button').trigger('click');

		expect(cookiesSet).toHaveBeenCalledWith(
			'onboarding-grace-popup-skipped',
			'true',
			expect.objectContaining({ path: '/' }),
		);
	});

	test('does not dismiss on overlay click', async () => {
		const wrapper = mountPopup();
		await wrapper.get('.overlay-close').trigger('click');

		expect(wrapper.text()).toContain('Have a license key?');
	});
});
