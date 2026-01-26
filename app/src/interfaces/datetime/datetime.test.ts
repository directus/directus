import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import Datetime from './datetime.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const global: GlobalMountOptions = {
	stubs: {
		VIcon: true,
		VRemove: true,
		VListItem: { template: '<v-list-item-stub><slot /></v-list-item-stub>' },
	},
	directives: {
		tooltip: () => {},
	},
	plugins: [
		createTestingPinia({
			createSpy: vi.fn,
		}),
	],
};

describe('Interface', () => {
	it('should mount', () => {
		const wrapper = mount(Datetime, {
			props: {
				value: null,
				type: 'dateTime',
			},
			global,
		});

		expect(wrapper.exists()).toBe(true);
	});

	it('should render calendar icon when null', () => {
		const wrapper = mount(Datetime, {
			props: {
				value: null,
				type: 'dateTime',
			},
			global,
		});

		expect(wrapper.find('.item-actions v-icon-stub').attributes('name')).toBe('today');
	});

	it('should render remove button when value is set', () => {
		const wrapper = mount(Datetime, {
			props: {
				value: '2024-01-01T12:00:00Z',
				type: 'dateTime',
			},
			global,
		});

		expect(wrapper.find('.item-actions v-remove-stub').exists()).toBe(true);
	});

	it('should hide action buttons when nonEditable is true', () => {
		const wrapper = mount(Datetime, {
			props: {
				value: '2024-01-01T12:00:00Z',
				nonEditable: true,
				// Note: if nonEditable is true, disabled prop will also be true
				disabled: true,
				type: 'dateTime',
			},
			global,
		});

		expect(wrapper.find('.item-actions').exists()).toBe(false);
	});

	it('should render action buttons disabled when disabled is true', () => {
		const wrapper = mount(Datetime, {
			props: {
				value: '2024-01-01T12:00:00Z',
				disabled: true,
				type: 'dateTime',
			},
			global,
		});

		expect(wrapper.find('v-list-item-stub').attributes('disabled')).toBe('true');
		expect(wrapper.find('.item-actions v-remove-stub').attributes('disabled')).toBe('true');
	});
});
