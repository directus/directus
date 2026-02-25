import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Tags from './tags.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import VChip from '@/components/v-chip.vue';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VChip,
	},
	directives: {
		tooltip: () => {},
		focus: () => {},
	},
	plugins: [i18n],
};

describe('Variable mode', () => {
	it('renders variable string as readonly input with clear button, no chips', () => {
		const wrapper = mount(Tags, {
			props: { value: '{{$trigger.payload.id}}', rawEditorEnabled: true },
			global,
		});

		expect(wrapper.find('input[readonly]').exists()).toBe(true);
		expect((wrapper.find('input[readonly]').element as HTMLInputElement).value).toBe('{{$trigger.payload.id}}');
		expect(wrapper.find('v-icon-stub[name="close"]').exists()).toBe(true);
		expect(wrapper.findAll('.v-chip.tag').length).toBe(0);
	});

	it('pressing Enter in variable mode does not add a tag', async () => {
		const wrapper = mount(Tags, {
			props: { value: '{{$trigger.payload.id}}', rawEditorEnabled: true },
			global,
		});

		await wrapper.find('input[readonly]').trigger('keydown', { key: 'Enter' });

		expect(wrapper.emitted('input')).toBeUndefined();
	});

	it('clicking clear button emits empty value and exits variable mode', async () => {
		const wrapper = mount(Tags, {
			props: { value: '{{$trigger.payload.id}}', rawEditorEnabled: true },
			global,
		});

		await wrapper.find('v-icon-stub[name="close"]').trigger('click');

		expect(wrapper.emitted('input')).toBeTruthy();
		expect(wrapper.emitted('input')![0]).toEqual([null]);
		expect(wrapper.find('input[readonly]').exists()).toBe(false);
	});

	it('any string value triggers variable mode when rawEditorEnabled', () => {
		const wrapper = mount(Tags, { props: { value: 'foo', rawEditorEnabled: true }, global });

		expect(wrapper.find('input[readonly]').exists()).toBe(true);
	});

	it('string value without rawEditorEnabled stays in normal tags mode', () => {
		const wrapper = mount(Tags, { props: { value: '{{$trigger.payload.id}}' }, global });

		expect(wrapper.find('input[readonly]').exists()).toBe(false);
	});

	it('null or array value stays in normal tags mode', () => {
		const wrapper1 = mount(Tags, { props: { value: null }, global });
		const wrapper2 = mount(Tags, { props: { value: ['a', 'b'] }, global });

		expect(wrapper1.find('input[readonly]').exists()).toBe(false);
		expect(wrapper2.find('input[readonly]').exists()).toBe(false);
	});
});

describe('Interface', () => {
	const presets = ['Tag 1', 'Tag 2', 'Tag 3'];
	const value = ['Value 1', 'Value 2'];

	it('should mount', () => {
		const wrapper = mount(Tags, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render custom tags', () => {
		const wrapper = mount(Tags, {
			props: {
				value,
				presets,
			},
			global,
		});

		expect(wrapper.find('.custom').exists()).toBe(true);
		expect(wrapper.findAll('.custom .v-chip.tag').length).toBe(2);
	});

	it('should render preset tags', () => {
		const wrapper = mount(Tags, {
			props: {
				value: null,
				presets,
			},
			global,
		});

		expect(wrapper.find('.presets').exists()).toBe(true);
		expect(wrapper.findAll('.presets .v-chip.tag').length).toBe(3);
	});

	it('should render tags disabled when disabled is true', () => {
		const wrapper = mount(Tags, {
			props: {
				value,
				presets,
				disabled: true,
			},
			global,
		});

		wrapper.findAll('.v-chip.tag').forEach((chip) => {
			expect(chip.attributes('disabled')).toBe('');
		});
	});
});
