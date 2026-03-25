import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import SearchInput from './search-input.vue';
import { ClickOutside } from '@/__utils__/click-outside';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
	},
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
	directives: {
		'click-outside': ClickOutside,
		tooltip: Tooltip,
	},
	provide: {
		'main-element': document.body,
	},
};

describe('Component', () => {
	it('should mount', () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: '',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled', () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'test',
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.search-input').classes()).toContain('disabled');

		expect(wrapper.find('v-icon-stub.icon-search').attributes('disabled')).toBe('true');
		expect(wrapper.find('v-icon-stub.icon-filter').attributes('disabled')).toBe('true');
		expect(wrapper.find('v-icon-stub.icon-clear').attributes('disabled')).toBe('true');

		expect(wrapper.find('input').attributes('disabled')).toBe('');
	});

	it('should close on keyboard focusout even when filter is active', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'test',
			},
			global,
		});

		const search = wrapper.find('.search-input');
		const input = wrapper.find('input');

		await search.trigger('click');
		await wrapper.find('v-icon-stub.icon-filter').trigger('click');

		expect(search.classes()).toContain('active');
		expect(search.classes()).toContain('filter-active');

		const outside = document.createElement('button');
		document.body.appendChild(outside);

		input.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
		await wrapper.vm.$nextTick();

		expect(search.classes()).not.toContain('active');
		expect(search.classes()).not.toContain('filter-active');

		document.body.removeChild(outside);
	});

	it('should close when focus leaves a descendant element of search area', async () => {
		const wrapper = mount(SearchInput, {
			props: {
				modelValue: 'test',
			},
			global,
		});

		const search = wrapper.find('.search-input');

		await search.trigger('click');
		await wrapper.find('v-icon-stub.icon-filter').trigger('click');

		expect(search.classes()).toContain('active');
		expect(search.classes()).toContain('filter-active');

		const descendant = document.createElement('button');
		search.element.appendChild(descendant);

		const outside = document.createElement('button');
		document.body.appendChild(outside);

		descendant.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
		await wrapper.vm.$nextTick();

		expect(search.classes()).not.toContain('active');
		expect(search.classes()).not.toContain('filter-active');

		search.element.removeChild(descendant);
		document.body.removeChild(outside);
	});
});
