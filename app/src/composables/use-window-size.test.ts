import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import { useWindowSize } from './use-window-size';

const testComponent = defineComponent({
	setup() {
		const { width, height } = useWindowSize();
		return { width, height };
	},
	render: () => h('div'),
});

describe('useWindowSize', () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	test('should update width and height on window resize', async () => {
		const targetWidth = 1000;
		const targetHeight = 1000;

		const wrapper = mount(testComponent, { attachTo: document } as any);

		// default values at the start due to happy-dom v8
		// Ref: https://github.com/capricorn86/happy-dom/releases/tag/v8.0.0
		expect(wrapper.vm.width).toBe(1024);
		expect(wrapper.vm.height).toBe(768);

		// manually simulate the resizing of window
		const resizeEvent = new Event('resize');
		// document.defaultView contains the window object
		document.defaultView!.innerWidth = targetWidth;
		document.defaultView!.innerHeight = targetHeight;
		document.defaultView!.dispatchEvent(resizeEvent);

		expect(wrapper.vm.width).toBe(targetWidth);
		expect(wrapper.vm.height).toBe(targetHeight);
	});
});
