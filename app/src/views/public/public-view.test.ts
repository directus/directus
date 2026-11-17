import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { createI18n } from 'vue-i18n';
import PublicView from './public-view.vue';

const artVisible = ref(true);
const serverInfo = ref<Record<string, any>>({ project: {} });

vi.mock('@vueuse/core', async (importOriginal) => ({
	...(await importOriginal<typeof import('@vueuse/core')>()),
	useMediaQuery: () => artVisible,
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => ({ info: serverInfo }),
}));

vi.mock('pinia', async (importOriginal) => ({
	...(await importOriginal<typeof import('pinia')>()),
	storeToRefs: (store: any) => store,
}));

vi.mock('./components/shader-background.vue', () => ({
	__esModule: true,
	default: defineComponent({ name: 'ShaderBackground', render: () => h('canvas', { class: 'shader-stub' }) }),
}));

const i18n = createI18n({
	legacy: false,
	missingWarn: false,
	locale: 'en-US',
	messages: { 'en-US': {} },
});

function mountView() {
	return mount(PublicView, {
		global: {
			plugins: [i18n],
			directives: { md: () => {} },
			stubs: ['VImage', 'VLicenseBadge', 'VTextOverflow'],
		},
	});
}

describe('PublicView shader background', () => {
	beforeEach(() => {
		artVisible.value = true;
		serverInfo.value = { project: {} };
	});

	test('mounts the shader when the art panel is visible', async () => {
		const wrapper = mountView();
		await vi.dynamicImportSettled();

		expect(wrapper.find('.shader-stub').exists()).toBe(true);
	});

	test('skips the shader on narrow screens where the art panel is hidden', async () => {
		artVisible.value = false;

		const wrapper = mountView();
		await vi.dynamicImportSettled();

		expect(wrapper.find('.shader-stub').exists()).toBe(false);
	});

	test('skips the shader when a custom background is set', async () => {
		serverInfo.value = { project: { public_background: { id: 'abc', type: 'image/png' } } };

		const wrapper = mountView();
		await vi.dynamicImportSettled();

		expect(wrapper.find('.shader-stub').exists()).toBe(false);
	});
});
