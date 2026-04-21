import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import SsoLinks from './sso-links.vue';
import { i18n } from '@/lang';

const mockRoute = vi.hoisted(() => ({
	query: {} as Record<string, unknown>,
}));

vi.mock('vue-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-router')>();

	return {
		...actual,
		useRoute: () => mockRoute,
	};
});

const VTextOverflowStub = defineComponent({
	name: 'VTextOverflow',
	props: {
		text: {
			type: String,
			required: true,
		},
	},
	template: '<span>{{ text }}</span>',
});

describe('SsoLinks', () => {
	beforeEach(() => {
		mockRoute.query = {};
		localStorage.clear();
		sessionStorage.clear();
	});

	function mountComponent() {
		return mountWithProviders([{ name: 'okta', driver: 'openid', label: 'Okta', icon: 'lock' }]);
	}

	function mountWithProviders(providers: { name: string; driver: string; label: string; icon: string }[]) {
		return mount(SsoLinks, {
			props: {
				providers,
			},
			global: {
				plugins: [i18n],
				stubs: {
					TransitionExpand: defineComponent({ template: '<div><slot /></div>' }),
					VDivider: true,
					VIcon: true,
					VInput: true,
					VNotice: defineComponent({ template: '<div><slot /></div>' }),
					VProgressCircular: true,
					VTextOverflow: VTextOverflowStub,
				},
			},
		});
	}

	test('shows the explicit sso non-admin message before falling back to api error translations', () => {
		mockRoute.query = { reason: 'SSO_NON_ADMIN' };

		const wrapper = mountComponent();

		expect(wrapper.text()).toContain(i18n.global.t('errors.SSO_NON_ADMIN'));
	});

	test('shows the explicit sso disabled message before falling back to api error translations', () => {
		mockRoute.query = { reason: 'SSO_DISABLED' };

		const wrapper = mountComponent();

		expect(wrapper.text()).toContain(i18n.global.t('errors.SSO_DISABLED'));
	});

	test('shows the sso disabled message even when no sso providers are available', () => {
		mockRoute.query = { reason: 'SSO_DISABLED' };

		const wrapper = mountWithProviders([]);

		expect(wrapper.text()).toContain(i18n.global.t('errors.SSO_DISABLED'));
	});

	test('does not show generic api errors when no sso providers are available', () => {
		mockRoute.query = { reason: 'INVALID_CREDENTIALS' };

		const wrapper = mountWithProviders([]);

		expect(wrapper.text()).not.toContain(i18n.global.t('errors.INVALID_CREDENTIALS'));
	});
});
