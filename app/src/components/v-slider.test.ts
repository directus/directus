import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import VSlider from './v-slider.vue';

test('Mount component', () => {
	expect(VSlider).toBeTruthy();

	const wrapper = mount(VSlider);

	expect(wrapper.html()).toMatchSnapshot();
});

test('modelValue prop', async () => {
	const wrapper = mount(VSlider, {
		props: {
			modelValue: 20,
		},
	});

	expect(wrapper.get('input').element.value).toBe('20');

	await wrapper.get('input').setValue(30);

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([30]);
});

test('min prop', async () => {
	const wrapper = mount(VSlider, {
		props: {
			min: 40,
		},
	});

	await wrapper.get('input').setValue(30);

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([40]);
});

test('max prop', async () => {
	const wrapper = mount(VSlider, {
		props: {
			max: 40,
		},
	});

	await wrapper.get('input').setValue(50);

	expect(wrapper.emitted()['update:modelValue']?.[0]).toEqual([40]);
});

test('uses stepped midpoint when modelValue is null', () => {
	const wrapper = mount(VSlider, {
		props: {
			modelValue: null,
			min: 0,
			max: 5,
			step: 1,
		},
	});

	const slider = wrapper.find('.v-slider');
	expect(slider.exists()).toBe(true);

	const style = slider.attributes('style');
	expect(style).toContain('--_v-slider-percentage: 60');
});

test('defaults to 0% fill when modelValue is undefined', () => {
	const wrapper = mount(VSlider, {
		props: {
			min: 0,
			max: 5,
			step: 1,
		},
	});

	const style = wrapper.find('.v-slider').attributes('style');
	expect(style).toContain('--_v-slider-percentage: 0');
});

test('renders ticks when tick count is within limit', () => {
	const wrapper = mount(VSlider, {
		props: {
			showTicks: true,
			min: 0,
			max: 10,
			step: 1,
		},
	});

	expect(wrapper.find('.ticks').exists()).toBe(true);
	expect(wrapper.findAll('.tick')).toHaveLength(11);
});

test('renders ticks with default min, max, and step', () => {
	const wrapper = mount(VSlider, {
		props: {
			showTicks: true,
		},
	});

	expect(wrapper.find('.ticks').exists()).toBe(true);
	expect(wrapper.findAll('.tick')).toHaveLength(101);
});

test('renders ticks at the threshold (tick count === 101)', () => {
	const wrapper = mount(VSlider, {
		props: {
			showTicks: true,
			min: 0,
			max: 200,
			step: 2,
		},
	});

	expect(wrapper.find('.ticks').exists()).toBe(true);
	expect(wrapper.findAll('.tick')).toHaveLength(101);
});

test('does not render ticks just past the threshold (tick count === 102)', () => {
	const wrapper = mount(VSlider, {
		props: {
			showTicks: true,
			min: 0,
			max: 101,
			step: 1,
		},
	});

	expect(wrapper.find('.ticks').exists()).toBe(false);
});

test('does not render ticks when tick count exceeds limit', () => {
	const wrapper = mount(VSlider, {
		props: {
			showTicks: true,
			min: -9999,
			max: 9999,
			step: 1,
		},
	});

	expect(wrapper.find('.ticks').exists()).toBe(false);
});
