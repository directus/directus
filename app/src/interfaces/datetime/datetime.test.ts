import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Datetime from './datetime.vue';
import { ClickOutside } from '@/__utils__/click-outside';
import { Focus } from '@/__utils__/focus';
import { Tooltip } from '@/__utils__/tooltip';
import type { GlobalMountOptions } from '@/__utils__/types';

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
		VListItem: { template: '<div class="v-list-item-stub"><slot /></div>' },
	},
	directives: {
		'click-outside': ClickOutside,
		focus: Focus,
		tooltip: Tooltip,
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

		expect(wrapper.find('.v-list-item-stub').attributes('disabled')).toBe('true');
		expect(wrapper.find('.item-actions v-remove-stub').attributes('disabled')).toBe('true');
	});

	describe('tzValue computed', () => {
		const STORED_UTC = '2024-06-15T16:00:00.000Z';
		const TZ = 'America/New_York';
		const EXPECTED_PICKER_MODEL = '2024-06-15T17:00:00.000Z';

		const tzGlobal: GlobalMountOptions = {
			...global,
			stubs: {
				...global.stubs,
				VMenu: {
					name: 'VMenu',
					template: '<div><slot name="activator" :toggle="() => {}" :active="false" /><slot /></div>',
				},
				VDatePicker: {
					name: 'VDatePicker',
					template: '<div />',
					props: ['modelValue'],
					emits: ['update:modelValue'],
				},
			},
		};

		function datePicker(wrapper: ReturnType<typeof mount<typeof Datetime>>) {
			return wrapper.findComponent({ name: 'VDatePicker' });
		}

		describe('getter', () => {
			it('should pass null to the date picker when value is null', () => {
				const wrapper = mount(Datetime, {
					props: { value: null, type: 'timestamp', tz: TZ },
					global: tzGlobal,
				});

				expect(datePicker(wrapper).props('modelValue')).toBeNull();
			});

			it('should convert stored UTC to zoned ISO for the date picker when type is timestamp and tz is set', () => {
				const wrapper = mount(Datetime, {
					props: { value: STORED_UTC, type: 'timestamp', tz: TZ },
					global: tzGlobal,
				});

				expect(datePicker(wrapper).props('modelValue')).toBe(EXPECTED_PICKER_MODEL);
			});

			it('should pass the value through when type is timestamp but tz is omitted', () => {
				const wrapper = mount(Datetime, {
					props: { value: STORED_UTC, type: 'timestamp' },
					global: tzGlobal,
				});

				expect(datePicker(wrapper).props('modelValue')).toBe(STORED_UTC);
			});

			it('should pass the value through when tz is set but type is not timestamp', () => {
				const value = '2024-01-01T12:00:00Z';

				const wrapper = mount(Datetime, {
					props: { value, type: 'dateTime', tz: TZ },
					global: tzGlobal,
				});

				expect(datePicker(wrapper).props('modelValue')).toBe(value);
			});
		});

		describe('setter', () => {
			it('should emit null when the date picker clears the value', async () => {
				const wrapper = mount(Datetime, {
					props: { value: STORED_UTC, type: 'timestamp', tz: TZ },
					global: tzGlobal,
				});

				await datePicker(wrapper).vm.$emit('update:modelValue', null);
				expect(wrapper.emitted('input')?.[0]).toEqual([null]);
			});

			it('should emit null when the date picker sends an empty string', async () => {
				const wrapper = mount(Datetime, {
					props: { value: STORED_UTC, type: 'timestamp', tz: TZ },
					global: tzGlobal,
				});

				await datePicker(wrapper).vm.$emit('update:modelValue', '');
				expect(wrapper.emitted('input')?.[0]).toEqual([null]);
			});

			it('should emit stored UTC when the date picker sends the zoned model value', async () => {
				const wrapper = mount(Datetime, {
					props: { value: STORED_UTC, type: 'timestamp', tz: TZ },
					global: tzGlobal,
				});

				await datePicker(wrapper).vm.$emit('update:modelValue', EXPECTED_PICKER_MODEL);
				expect(wrapper.emitted('input')?.[0]).toEqual([STORED_UTC]);
			});
		});
	});
});
