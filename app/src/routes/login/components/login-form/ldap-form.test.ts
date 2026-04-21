import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent } from 'vue';
import LdapForm from './ldap-form.vue';
import { i18n } from '@/lang';

const mockRoute = vi.hoisted(() => ({
	query: {} as Record<string, unknown>,
}));

vi.mock('vue-router', async (importOriginal) => {
	const actual = await importOriginal<typeof import('vue-router')>();

	return {
		...actual,
		useRoute: () => mockRoute,
		useRouter: () => ({ replace: vi.fn(), currentRoute: { value: { query: {} } }, push: vi.fn() }),
	};
});

vi.mock('@/auth', () => ({
	login: vi.fn(),
}));

const VInputStub = defineComponent({
	name: 'VInput',
	props: {
		modelValue: {
			type: String,
			default: null,
		},
	},
	template: '<input />',
});

describe('LdapForm', () => {
	beforeEach(() => {
		mockRoute.query = {};
	});

	test('shows project locked in the inline warning area', () => {
		mockRoute.query = { reason: 'PROJECT_LOCKED' };

		const wrapper = mount(LdapForm, {
			props: {
				provider: 'ldap',
			},
			global: {
				plugins: [i18n, createTestingPinia({ createSpy: vi.fn, stubActions: false })],
				stubs: {
					TransitionExpand: defineComponent({ template: '<div><slot /></div>' }),
					VButton: true,
					VInput: VInputStub,
					VNotice: defineComponent({ template: '<div><slot /></div>' }),
					VTextOverflow: true,
				},
			},
		});

		expect(wrapper.text()).toContain(i18n.global.t('logoutReason.PROJECT_LOCKED'));
	});
});
