import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { describe, expect, test, vi } from 'vitest';
import PinnedStatusNotice from './pinned-status-notice.vue';
import { mockedStore } from '@/__utils__/store';
import { i18n } from '@/lang';
import { useLicenseStore } from '@/stores/license';
import { useUserStore } from '@/stores/user';

const global = {
	plugins: [i18n],
	stubs: {
		VIcon: true,
		RouterLink: { template: '<a :data-to="to.name"><slot /></a>', props: ['to'] },
	},
};

function setupStores() {
	setActivePinia(createTestingPinia({ createSpy: vi.fn }));

	const licenseStore = mockedStore(useLicenseStore());
	const userStore = mockedStore(useUserStore());

	userStore.isAdmin = true;
	licenseStore.isLocked = false;
	licenseStore.isCoreGrace = false;
	licenseStore.gracePeriodDaysRemaining = null;
	licenseStore.licenseWarning = { reason: 'binding_mismatch', severity: 'danger', daysRemaining: 5 };

	return { licenseStore, userStore };
}

describe('pinned-status-notice', () => {
	test('shows the license warning with a link to the license settings', () => {
		setupStores();

		const wrapper = mount(PinnedStatusNotice, { global });

		const notices = wrapper.findAll('.pinned-status-notice');

		expect(notices).toHaveLength(1);
		expect(notices[0]!.classes()).toContain('danger');
		expect(notices[0]!.find('.notice-title').text()).toBe('License URL Mismatch (5d left)');
		expect(notices[0]!.find('a').attributes('data-to')).toBe('settings-license');
	});

	test('shows the warning before the grace notice when both apply', () => {
		const { licenseStore } = setupStores();
		licenseStore.gracePeriodDaysRemaining = 10;

		const wrapper = mount(PinnedStatusNotice, { global });

		const titles = wrapper.findAll('.notice-title').map((title) => title.text());

		expect(titles).toEqual(['License URL Mismatch (5d left)', 'Grace Period (10d left)']);
	});

	test('shows nothing to non-admins', () => {
		const { userStore } = setupStores();
		userStore.isAdmin = false;

		const wrapper = mount(PinnedStatusNotice, { global });

		expect(wrapper.find('.pinned-status-notice').exists()).toBe(false);
	});
});
