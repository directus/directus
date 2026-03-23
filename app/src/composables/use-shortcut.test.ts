import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useShortcut } from './use-shortcut';

function getTestComponent(shortcut: string, handler: () => void) {
	return defineComponent({
		setup() {
			useShortcut(shortcut, handler);
		},
		render: () => h('div'),
	});
}

describe('useShortcut', () => {
	let shortcutHandler: Mock;

	beforeEach(() => {
		shortcutHandler = vi.fn();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test.each(['Control', 'Command'])('should map "%s" key to "meta"', async (testKey) => {
		const keys = ['meta', 's'];
		const testComponent = getTestComponent(keys.join('+'), shortcutHandler);
		const wrapper = mount(testComponent, { attachTo: document.body });

		// intentionally not using keys[0] as we want to test Control/Command, not meta itself
		await wrapper.trigger('keydown', { key: testKey });
		await wrapper.trigger('keydown', { key: keys[1] });
		await wrapper.trigger('keyup', { key: testKey });

		expect(shortcutHandler).toHaveBeenCalledOnce();
	});

	test('should trigger with combination of shortcut keys', async () => {
		const keys = ['meta', 'alt', 'c'];
		const testComponent = getTestComponent(keys.join('+'), shortcutHandler);
		const wrapper = mount(testComponent, { attachTo: document.body });

		for (const key of keys) {
			await wrapper.trigger('keydown', { key });
		}

		await wrapper.trigger('keyup', { key: keys[0] });

		expect(shortcutHandler).toHaveBeenCalledOnce();
	});
});
