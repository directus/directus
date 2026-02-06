import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SelectIcon from './select-icon.vue';
import { ClickOutside } from '@/__utils__/click-outside';
import { Focus } from '@/__utils__/focus';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';
import { i18n } from '@/lang';

beforeEach(() => {
	for (const id of ['menu-outlet', 'dialog-outlet']) {
		if (!document.getElementById(id)) {
			const el = document.createElement('div');
			el.id = id;
			document.body.appendChild(el);
		}
	}
});

afterEach(() => {
	for (const id of ['menu-outlet', 'dialog-outlet']) {
		const el = document.getElementById(id);
		if (el) el.remove();
	}
});

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VRemove: true,
	},
	plugins: [
		i18n,
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
	directives: {
		'click-outside': ClickOutside,
		focus: Focus,
		tooltip: Tooltip,
	},
	provide: {
		'main-element': document.body,
	},
};

describe('Interface', () => {
	it('should mount', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render icon when null', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: null,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-icon-stub').attributes('name')).toBe('expand_more');
	});

	it('should render remove button when value is set', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
	});

	it('should mount', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render action buttons disabled when disabled is true', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').attributes('disabled')).toBe('true');
		expect(wrapper.find('.v-input .input input').attributes('disabled')).toBe('');
	});

	it('should hide action buttons when nonEditable is true', () => {
		const wrapper = mount(SelectIcon, {
			props: {
				value: 'launch',
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(false);
	});
});
