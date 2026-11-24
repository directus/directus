import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import VTemplateInput from './v-template-input.vue';

const mentionId = '6f1d3a1e-4c2b-4d5e-8f9a-0b1c2d3e4f5a';

const baseProps = {
	captureGroup: '(@[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})',
	triggerCharacter: '@',
	items: { [mentionId]: 'Jane Doe' },
};

describe('v-template-input', () => {
	test('renders HTML in the model value as text, not elements', () => {
		const modelValue = '<form action=a><input type=password name=pass><button>submit</button></form>';

		const wrapper = mount(VTemplateInput, { props: { ...baseProps, modelValue } });

		expect(wrapper.find('form').exists()).toBe(false);
		expect(wrapper.find('input').exists()).toBe(false);
		expect(wrapper.find('button').exists()).toBe(false);
		expect(wrapper.element.textContent).toBe(modelValue);
	});

	test('renders mentions as preview marks', () => {
		const wrapper = mount(VTemplateInput, { props: { ...baseProps, modelValue: `hi @${mentionId} <b>x</b>` } });

		const mark = wrapper.find('mark.preview');

		expect(mark.exists()).toBe(true);
		expect(mark.attributes('data-preview')).toBe('Jane Doe');
		expect(wrapper.find('b').exists()).toBe(false);
	});
});
