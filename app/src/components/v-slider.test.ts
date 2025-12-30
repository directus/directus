import VSlider from './v-slider.vue';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';


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
