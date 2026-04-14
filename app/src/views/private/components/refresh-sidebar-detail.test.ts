import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { createI18n } from 'vue-i18n';
import RefreshSidebarDetail from './refresh-sidebar-detail.vue';

vi.mock('@/events', () => ({
	emitter: { on: vi.fn(), off: vi.fn() },
	Events: { tabIdle: 'tabIdle', tabActive: 'tabActive' },
}));

vi.mock('./sidebar-detail.vue', () => ({
	default: { template: '<div><slot /></div>' },
}));

vi.mock('@/components/v-select/v-select.vue', () => ({
	default: { template: '<select />' },
}));

const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

describe('refresh-sidebar-detail timer lifecycle', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('clears interval on unmount', () => {
		const wrapper = mount(RefreshSidebarDetail, {
			props: { modelValue: 30 },
			global: { plugins: [i18n] },
		});

		// Spy created after mount — only captures calls from onUnmounted
		const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
		wrapper.unmount();

		expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
	});

	it('does not emit refresh after unmount', async () => {
		const refreshSpy = vi.fn();

		const Parent = defineComponent({
			components: { RefreshSidebarDetail },
			setup() {
				return { refreshSpy };
			},
			template: '<RefreshSidebarDetail :model-value="10" @refresh="refreshSpy" />',
		});

		const wrapper = mount(Parent, { global: { plugins: [i18n] } });
		wrapper.unmount();

		vi.advanceTimersByTime(15_000);

		// After unmount the interval should be gone — no refresh calls
		expect(refreshSpy).not.toHaveBeenCalled();
	});
});
