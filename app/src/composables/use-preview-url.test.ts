import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { usePreviewUrl } from './use-preview-url';
import { useSettingsStore } from '@/stores/settings';

vi.mock('@/sdk', () => ({
	default: { request: vi.fn().mockResolvedValue({ slug: 'my-post' }) },
	requestEndpoint: (endpoint: string, options: any) => ({ endpoint, ...options }),
}));

vi.mock('@/extensions', () => ({
	useExtensions: () => ({ displays: ref([]) }),
}));

vi.mock('@/utils/adjust-fields-for-displays', () => ({
	adjustFieldsForDisplays: (fields: readonly string[]) => [...fields],
}));

const TestComponent = defineComponent({
	props: ['template'], // eslint-disable-line vue/require-prop-types
	setup(props) {
		return usePreviewUrl(
			ref({ collection: 'articles', meta: { preview_url: props.template } } as any),
			ref('1'),
			ref(null),
		);
	},
	render: () => '',
});

async function resolve(template: string, previewBaseUrl: string | null) {
	useSettingsStore().settings = { preview_base_url: previewBaseUrl } as any;

	const wrapper = mount(TestComponent, { props: { template } });
	await flushPromises();

	return wrapper.vm as unknown as { previewUrl: string | null; previewConfigured: boolean };
}

describe('usePreviewUrl', () => {
	beforeEach(() => {
		setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));
	});

	test('Resolves the base URL variable against the setting', async () => {
		const vm = await resolve('{{$preview_base_url}}/blog/{{slug}}', 'https://staging-site.com');

		expect(vm.previewConfigured).toBe(true);
		expect(vm.previewUrl).toBe('https://staging-site.com/blog/my-post');
	});

	test('Suppresses the preview when the template needs a base URL that is not set', async () => {
		const vm = await resolve('{{$preview_base_url}}/blog/{{slug}}', null);

		expect(vm.previewConfigured).toBe(false);
		expect(vm.previewUrl).toBeNull();
	});

	test('Does not double up slashes when the setting has a trailing slash', async () => {
		const vm = await resolve('{{$preview_base_url}}/blog/{{slug}}', 'https://staging-site.com/');

		expect(vm.previewUrl).toBe('https://staging-site.com/blog/my-post');
	});

	test('Leaves a hardcoded template alone', async () => {
		const vm = await resolve('https://example.com/blog/{{slug}}', null);

		expect(vm.previewConfigured).toBe(true);
		expect(vm.previewUrl).toBe('https://example.com/blog/my-post');
	});
});
