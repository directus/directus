import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import VIconFile from './v-icon-file.vue';

test('Mount component', () => {
	expect(VIconFile).toBeTruthy();

	const wrapper = mount(VIconFile, {
		props: {
			ext: 'png',
		},
		global: {
			plugins: [
				createTestingPinia({
					createSpy: vi.fn,
				}),
			],
			stubs: ['v-icon'],
		},
	});

	expect(wrapper.html()).toMatchSnapshot();
});
