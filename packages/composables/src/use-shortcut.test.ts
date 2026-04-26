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

	test('should not trigger when a specific target element is provided but a different element is focused', async () => {
		const targetEl = document.createElement('div');
		document.body.appendChild(targetEl);
		const otherEl = document.createElement('input');
		document.body.appendChild(otherEl);

		const targetRef = ref(targetEl);

		const testComponent = defineComponent({
			setup() {
				useShortcut('meta+k', shortcutHandler, targetRef);
			},
			render: () => h('div'),
		});

		mount(testComponent, { attachTo: document.body });

		// Focus a different element (not the target)
		otherEl.focus();

		await document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', bubbles: true }));
		await document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
		await document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta', bubbles: true }));

		expect(shortcutHandler).not.toHaveBeenCalled();

		document.body.removeChild(targetEl);
		document.body.removeChild(otherEl);
	});

	test('should trigger when a specific target element is provided and it is focused', async () => {
		const targetEl = document.createElement('div');
		targetEl.setAttribute('tabindex', '0');
		document.body.appendChild(targetEl);

		const targetRef = ref(targetEl);

		const testComponent = defineComponent({
			setup() {
				useShortcut('meta+k', shortcutHandler, targetRef);
			},
			render: () => h('div'),
		});

		mount(testComponent, { attachTo: document.body });

		// Focus the target element itself
		targetEl.focus();

		await document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Meta', bubbles: true }));
		await document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', bubbles: true }));
		await document.body.dispatchEvent(new KeyboardEvent('keyup', { key: 'Meta', bubbles: true }));

		expect(shortcutHandler).toHaveBeenCalledOnce();

		document.body.removeChild(targetEl);
	});
});
