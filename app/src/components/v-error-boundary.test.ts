import { mount } from '@vue/test-utils';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import VErrorBoundary from './v-error-boundary.vue';

beforeAll(() => {
	vi.spyOn(console, 'warn').mockImplementation(() => vi.fn());
});

afterAll(() => {
	vi.restoreAllMocks();
});

test('Mount component', () => {
	expect(VErrorBoundary).toBeTruthy();

	const wrapper = mount(VErrorBoundary);

	expect(wrapper.html()).toMatchSnapshot();
});

test('Should show default component when there is no error', async () => {
	const defaultComponent = defineComponent({ render: () => h('div', 'test') });
	const fallbackComponent = defineComponent({ render: () => h('div', 'fallback') });

	const wrapper = mount(VErrorBoundary, {
		slots: {
			default: defaultComponent,
			fallback: fallbackComponent,
		},
	});

	expect(wrapper.html()).toBe(`<div>test</div>`);
});

test('Should show fallback component when there is an error', async () => {
	const defaultComponent = defineComponent({
		setup: () => {
			// intentionally throw error to break this component
			throw new Error();
		},
		render: () => h('div', 'test'),
	});

	const fallbackComponent = defineComponent({ render: () => h('div', 'fallback') });

	const wrapper = mount(VErrorBoundary, {
		slots: {
			default: defaultComponent,
			fallback: fallbackComponent,
		},
	});

	// wait for dom to update
	await nextTick();

	expect(wrapper.html()).toBe(`<div>fallback</div>`);
});
