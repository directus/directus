import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, Mock, test, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { useShortcut } from './use-shortcut.js';

function getTestComponent(shortcut: string, handler: () => void) {
	return defineComponent({
		setup() {
			useShortcut(shortcut, handler);
		},
		render: () => h('div'),
	});
}

function getScopedTestComponent(shortcut: string, handler: () => void) {
	return defineComponent({
		setup() {
			const target = ref<HTMLElement>();
			useShortcut(shortcut, handler, target);
			return { target };
		},
		render() {
			return h('div', { ref: 'target' });
		},
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

	test('should not trigger scoped shortcut when focus is outside the target element', async () => {
		const keys = ['meta', 'k'];

		// Focus sink outside of the scoped target — dispatch keydown events from here instead.
		const focusSink = document.createElement('input');
		document.body.appendChild(focusSink);

		const testComponent = getScopedTestComponent(keys.join('+'), shortcutHandler);
		mount(testComponent, { attachTo: document.body });

		for (const key of keys) {
			focusSink.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
		}

		focusSink.dispatchEvent(new KeyboardEvent('keyup', { key: keys[0], bubbles: true }));

		expect(shortcutHandler).not.toHaveBeenCalled();

		focusSink.remove();
	});
});
