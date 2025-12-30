import { getVueComponentName } from './get-vue-component-name';
import { mount } from '@vue/test-utils';
import { expect, test } from 'vitest';
import { defineComponent, h } from 'vue';


test('should return unknown', () => {
	expect(getVueComponentName(null)).toBe('unknown');
});

test('should return root', () => {
	const defaultComponent = defineComponent({ render: () => h('div', 'test') });
	const wrapper = mount(defaultComponent);

	expect(getVueComponentName(wrapper.vm.$root)).toBe('root');
});

test('should return component name in kebab case', () => {
	const defaultComponent = defineComponent({ name: 'MyTestComponent', render: () => h('div', 'test') });
	const wrapper = mount(defaultComponent);

	expect(getVueComponentName(wrapper.vm)).toBe('my-test-component');
});

test('should return component file as name', () => {
	const defaultComponent = defineComponent({ render: () => h('div', 'test') });
	const wrapper = mount(defaultComponent);
	wrapper.vm.$options.__file = 'src/components/MyTestComponent.vue';

	expect(getVueComponentName(wrapper.vm)).toBe('my-test-component');
});

test('should return generic name "component"', () => {
	const defaultComponent = defineComponent({ render: () => h('div', 'test') });
	const wrapper = mount(defaultComponent);

	expect(getVueComponentName(wrapper.vm)).toBe('component');
});
