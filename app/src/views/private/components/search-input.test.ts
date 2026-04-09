import { createTestingPinia } from '@pinia/testing';
import { DOMWrapper, mount, VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

	describe('focusout behavior', () => {
		let wrapper: VueWrapper;
		let search: DOMWrapper<Element>;

		beforeEach(async () => {
			wrapper = mount(SearchInput, {
				props: {
					modelValue: 'test',
				},
				global,
			});

			search = wrapper.find('.search-input');

			await search.trigger('click');
			await wrapper.find('v-icon-stub.icon-filter').trigger('click');

			expect(search.classes()).toContain('active');
			expect(search.classes()).toContain('filter-active');
		});

		afterEach(() => {
			wrapper.unmount();
		});

		describe('when focus moves outside the search area', () => {
			let outside: HTMLButtonElement;
			let descendant: HTMLButtonElement;

			beforeEach(() => {
				outside = document.createElement('button');
				document.body.appendChild(outside);

				descendant = document.createElement('button');
				search.element.appendChild(descendant);
			});

			afterEach(() => {
				document.body.removeChild(outside);
				search.element.removeChild(descendant);
			});

			it('should close on keyboard focusout even when filter is active', async () => {
				wrapper
					.find('input')
					.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));

				await wrapper.vm.$nextTick();

				expect(search.classes()).not.toContain('active');
				expect(search.classes()).not.toContain('filter-active');
			});

			it('should close when focusout target is outside the search area', async () => {
				descendant.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
				await wrapper.vm.$nextTick();

				expect(search.classes()).not.toContain('active');
				expect(search.classes()).not.toContain('filter-active');
			});
		});

		describe('when focus moves into v-menu-content', () => {
			let menuContent: HTMLDivElement;
			let menuTarget: HTMLButtonElement;

			beforeEach(() => {
				menuContent = document.createElement('div');
				menuContent.className = 'v-menu-content';
				document.body.appendChild(menuContent);

				menuTarget = document.createElement('button');
				menuContent.appendChild(menuTarget);
			});

			afterEach(() => {
				document.body.removeChild(menuContent);
			});

			it('should stay open when focus moves into v-menu-content', async () => {
				wrapper
					.find('input')
					.element.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: menuTarget }));

				await wrapper.vm.$nextTick();

				expect(search.classes()).toContain('active');
				expect(search.classes()).toContain('filter-active');
			});
		});
	});
});
