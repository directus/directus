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
