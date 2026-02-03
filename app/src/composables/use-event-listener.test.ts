import { mount } from '@vue/test-utils';
import { expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { useEventListener } from '@/composables/use-event-listener';

test('Registers the event listener on mount, unregisters on unmount', () => {
	const target = {
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	} as any;

	const testHandler = () => {};

	const TestComponent = defineComponent({
		setup() {
			return useEventListener(target, 'click', testHandler);
		},
		render: () => h('div'),
	});

	const wrapper = mount(TestComponent);

	expect(target.addEventListener).toHaveBeenCalledWith('click', testHandler, undefined);

	wrapper.unmount();

	expect(target.removeEventListener).toHaveBeenCalledWith('click', testHandler, undefined);
});
