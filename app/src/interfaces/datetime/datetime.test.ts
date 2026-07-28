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
	mocks: {
		$t: (key: string) => key,
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

	describe('inline editing', () => {
		const editGlobal: GlobalMountOptions = {
			...global,
			stubs: {
				...global.stubs,
				DatePickerField: {
					name: 'DatePickerField',
					props: ['type', 'modelValue', 'includeSeconds', 'use24', 'disabled', 'autofocus'],
					template: '<div class="date-picker-field-stub" />',
				},
				VMenu: {
					name: 'VMenu',
					template: '<div><slot name="activator" :toggle="() => {}" :active="false" /><slot /></div>',
					methods: { activate: vi.fn(), deactivate: vi.fn() },
				},
				VDatePicker: { name: 'VDatePicker', template: '<div />' },
			},
		};

		function field(wrapper: ReturnType<typeof mount<typeof Datetime>>) {
			return wrapper.findComponent({ name: 'DatePickerField' });
		}

		it('swaps the template for the inline date field when the value region is clicked (type date)', async () => {
			const wrapper = mount(Datetime, {
				props: { value: '2024-01-15', type: 'date' },
				global: editGlobal,
			});

			expect(field(wrapper).exists()).toBe(false);

			await wrapper.find('.value').trigger('click');

			expect(field(wrapper).exists()).toBe(true);
		});

		it('enters inline edit for the time type', async () => {
			const wrapper = mount(Datetime, {
				props: { value: '14:30:00', type: 'time' },
				global: editGlobal,
			});

			await wrapper.find('.value').trigger('click');

			expect(field(wrapper).exists()).toBe(true);
		});

		it('does not enter inline edit for dynamic-variable values', async () => {
			const wrapper = mount(Datetime, {
				props: { value: '$NOW', type: 'date' },
				global: editGlobal,
			});

			await wrapper.find('.value').trigger('click');

			expect(field(wrapper).exists()).toBe(false);
		});

		it('does not enter inline edit when disabled', async () => {
			const wrapper = mount(Datetime, {
				props: { value: '2024-01-15', type: 'date', disabled: true },
				global: editGlobal,
			});

			await wrapper.find('.value').trigger('click');

			expect(field(wrapper).exists()).toBe(false);
		});

		it('enters inline edit mode when Enter is pressed on the focused value region', async () => {
			const wrapper = mount(Datetime, {
				props: { value: '2024-01-15', type: 'date' },
				global: editGlobal,
			});

			expect(field(wrapper).exists()).toBe(false);

			await wrapper.find('.value').trigger('keydown', { key: 'Enter' });

			expect(field(wrapper).exists()).toBe(true);
		});

		it('makes the value region a focusable button when interactive', () => {
			const wrapper = mount(Datetime, {
				props: { value: '2024-01-15', type: 'date' },
				global: editGlobal,
			});

			const value = wrapper.find('.value');
			expect(value.attributes('tabindex')).toBe('0');
			expect(value.attributes('role')).toBe('button');
		});

		it('is not a tab stop when disabled', () => {
			const wrapper = mount(Datetime, {
				props: { value: '2024-01-15', type: 'date', disabled: true },
				global: editGlobal,
			});

			expect(wrapper.find('.value').attributes('tabindex')).toBeUndefined();
		});

		it('shows the inline field as a placeholder when there is no value', () => {
			const wrapper = mount(Datetime, {
				props: { value: null, type: 'dateTime' },
				global: editGlobal,
			});

			expect(field(wrapper).exists()).toBe(true);
			// The placeholder field owns focus, so the value region itself is not a tab stop.
			expect(wrapper.find('.value').attributes('tabindex')).toBeUndefined();
		});

		it('does not show a placeholder field when empty and disabled', () => {
			const wrapper = mount(Datetime, {
				props: { value: null, type: 'dateTime', disabled: true },
				global: editGlobal,
			});

			expect(field(wrapper).exists()).toBe(false);
		});

		it('shows a placeholder field when empty for the time type', () => {
			const wrapper = mount(Datetime, {
				props: { value: null, type: 'time' },
				global: editGlobal,
			});

			expect(field(wrapper).exists()).toBe(true);
		});

		it('does not autofocus the placeholder field', () => {
			const wrapper = mount(Datetime, {
				props: { value: null, type: 'dateTime' },
				global: editGlobal,
			});

			expect(field(wrapper).props('autofocus')).toBe(false);
		});
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
		const EXPECTED_PICKER_MODEL = '2024-06-15T12:00:00.000Z';

		beforeEach(() => {
			vi.stubEnv('TZ', 'UTC');
		});

		afterEach(() => {
			vi.unstubAllEnvs();
		});

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
