import type { Field, Item } from '@directus/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, reactive, ref } from 'vue';
import calendarLayout, { getColorFields, getContrastColor, getEventColor, getEventStyling } from './index';

const mockDarkMode = ref(false);
const mockPrimaryKeyField = ref<Field | null>({
	collection: 'events',
	field: 'id',
	name: 'ID',
	type: 'integer',
	schema: null,
	meta: null,
});
const mockFieldsInCollection = ref<Field[]>([]);
const mockItems = ref<Item[]>([]);
let capturedItemsOptions: any = null;
const mockCalendarInstances: any[] = [];

vi.mock('vue-i18n', async (importOriginal) => {
	const actual = await importOriginal<any>();
	return {
		...actual,
		useI18n: () => ({
			t: (key: string) => key,
			n: (val: number) => String(val),
			locale: ref('en-US'),
		}),
	};
});

vi.mock('@/ai/stores/use-ai-tools', () => ({
	useAiToolsStore: () => ({
		onSystemToolResult: vi.fn(),
	}),
}));

vi.mock('@/stores/server', () => ({
	useServerStore: () => ({
		info: {
			queryLimit: { max: 100 },
		},
	}),
}));

vi.mock('@/composables/use-theme-configuration', () => ({
	useThemeConfiguration: () => ({
		darkMode: mockDarkMode,
	}),
}));

vi.mock('@/composables/use-version-query', () => ({
	useVersionQuery: () => ref(undefined),
}));

vi.mock('@/composables/use-layout-click-handler', () => ({
	useLayoutClickHandler: () => ({
		onClick: vi.fn(),
	}),
}));

vi.mock('@/utils/adjust-fields-for-displays', () => ({
	adjustFieldsForDisplays: vi.fn(() => []),
}));

vi.mock('@/utils/render-string-template', () => ({
	renderDisplayStringTemplate: vi.fn((_c, _t, item) => item?.title ?? item?.id ?? ''),
}));

vi.mock('@/utils/format-items-count', () => ({
	formatItemsCountRelative: vi.fn(() => '1 of 1'),
}));

vi.mock('@/utils/get-fullcalendar-locale', () => ({
	getFullcalendarLocale: vi.fn(),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

vi.mock('@/api', () => ({
	default: {
		patch: vi.fn(),
	},
}));

vi.mock('@directus/composables', async () => {
	const actual = await vi.importActual<any>('@directus/composables');
	return {
		...actual,
		useCollection: () => ({
			primaryKeyField: mockPrimaryKeyField,
			fields: mockFieldsInCollection,
		}),
		useItems: (_collection: any, options: any) => {
			capturedItemsOptions = options;
			return {
				items: mockItems,
				loading: ref(false),
				error: ref(null),
				totalPages: ref(1),
				itemCount: ref(1),
				totalCount: ref(1),
				changeManualSort: vi.fn(),
				getItems: vi.fn(),
				getItemCount: vi.fn(),
				getTotalCount: vi.fn(),
			};
		},
	};
});

vi.mock('@fullcalendar/core', async () => {
	const actual = await vi.importActual<any>('@fullcalendar/core');
	return {
		...actual,
		Calendar: vi.fn().mockImplementation(function (this: any, el: any, options: any) {
			this.el = el;
			this.options = options;
			this.render = vi.fn();
			this.on = vi.fn();
			this.pauseRendering = vi.fn();
			this.resetOptions = vi.fn((newOpts: any) => {
				this.options = newOpts;
			});
			this.resumeRendering = vi.fn();
			this.setOption = vi.fn();
			this.updateSize = vi.fn();
			this.destroy = vi.fn();
			this.view = {
				activeStart: new Date('2026-06-01T00:00:00Z'),
				activeEnd: new Date('2026-06-30T23:59:59Z'),
				currentStart: new Date('2026-06-01T00:00:00Z'),
				type: 'dayGridMonth',
			};
			mockCalendarInstances.push(this);
		}),
	};
});

function createMockField(field: string, type: string, interfaceType?: string): Field {
	return {
		collection: 'events',
		field,
		name: field,
		type,
		schema: null,
		meta: interfaceType
			? ({
					id: 1,
					collection: 'events',
					field,
					group: null,
					hidden: false,
					interface: interfaceType,
					display: null,
					display_options: null,
					options: null,
					readonly: false,
					required: false,
					sort: null,
					special: null,
					translations: null,
					width: 'full',
					note: null,
					conditions: null,
					validation: null,
					validation_message: null,
				} as any)
			: null,
	};
}

function createMockProps(overrides: Record<string, any> = {}) {
	return reactive({
		collection: 'events',
		selection: [],
		layoutOptions: {
			startDateField: 'start_date',
			endDateField: 'end_date',
			colorField: undefined,
			template: '{{ title }}',
		},
		layoutProps: {
			height: '100%',
		},
		search: null,
		filter: null,
		filterSystem: null,
		filterUser: null,
		selectMode: false,
		showSelect: 'none',
		resetPreset: vi.fn(),
		...overrides,
	});
}

describe('calendar layout helpers', () => {
	describe('getColorFields', () => {
		it('returns empty array when fields are empty', () => {
			expect(getColorFields([])).toEqual([]);
		});

		it('returns only colorPickerFields when stringFields are empty', () => {
			const colorField = createMockField('color', 'string', 'select-color');
			const dateField = createMockField('start_date', 'dateTime');

			const result = getColorFields([colorField, dateField]);
			expect(result).toEqual([colorField]);
		});

		it('returns only stringFields when colorPickerFields are empty', () => {
			const textField = createMockField('category', 'string', 'input');
			const intField = createMockField('count', 'integer');

			const result = getColorFields([textField, intField]);
			expect(result).toEqual([textField]);
		});

		it('returns both types separated by divider and header when both exist', () => {
			const colorField = createMockField('color', 'string', 'select-color');
			const textField = createMockField('category', 'string', 'input');

			const result = getColorFields([colorField, textField]);
			expect(result).toEqual([colorField, { divider: true }, { header: 'other' }, textField]);
		});

		it('supports custom translation function for header', () => {
			const colorField = createMockField('color', 'string', 'select-color');
			const textField = createMockField('category', 'string');

			const customT = vi.fn((key: string) => `translated_${key}`);
			const result = getColorFields([colorField, textField], customT);

			expect(customT).toHaveBeenCalledWith('other');
			expect(result).toEqual([colorField, { divider: true }, { header: 'translated_other' }, textField]);
		});
	});

	describe('getEventStyling', () => {
		it('returns display block and undefined color/textColor when colorField is not provided', () => {
			const item = { id: 1, title: 'Test', color: '#ff0000' };
			expect(getEventStyling(item, undefined)).toEqual({
				color: undefined,
				textColor: undefined,
				display: 'block',
			});
			expect(getEventStyling(item, null)).toEqual({
				color: undefined,
				textColor: undefined,
				display: 'block',
			});
		});

		it('returns display block and undefined color/textColor when field value is missing or empty', () => {
			expect(getEventStyling({ id: 1 }, 'color')).toEqual({
				color: undefined,
				textColor: undefined,
				display: 'block',
			});
			expect(getEventStyling({ id: 1, color: '   ' }, 'color')).toEqual({
				color: undefined,
				textColor: undefined,
				display: 'block',
			});
		});

		it('returns color and contrast textColor in light theme', () => {
			expect(getEventStyling({ id: 1, color: '#ffffff' }, 'color', false)).toEqual({
				color: '#ffffff',
				textColor: '#000000',
				display: 'block',
			});
			expect(getEventStyling({ id: 1, color: '#000000' }, 'color', false)).toEqual({
				color: '#000000',
				textColor: '#ffffff',
				display: 'block',
			});
		});

		it('returns contrast textColor in dark theme', () => {
			expect(getEventStyling({ id: 1, color: '#ffffff' }, 'color', true)).toEqual({
				color: '#ffffff',
				textColor: '#000000',
				display: 'block',
			});
			expect(getEventStyling({ id: 1, color: '#000000' }, 'color', true)).toEqual({
				color: '#000000',
				textColor: '#ffffff',
				display: 'block',
			});
		});

		it('handles transparent colors across light and dark themes', () => {
			expect(getEventStyling({ id: 1, color: 'transparent' }, 'color', false)).toEqual({
				color: 'transparent',
				textColor: '#000000',
				display: 'block',
			});
			expect(getEventStyling({ id: 1, color: 'transparent' }, 'color', true)).toEqual({
				color: 'transparent',
				textColor: '#ffffff',
				display: 'block',
			});
		});

		it('handles invalid color strings gracefully', () => {
			expect(getEventStyling({ id: 1, color: 'invalid-color' }, 'color')).toEqual({
				color: 'invalid-color',
				textColor: undefined,
				display: 'block',
			});
		});
	});

	describe('getEventColor and getContrastColor', () => {
		it('returns trimmed string or undefined for invalid values', () => {
			expect(getEventColor({ col: ' #123456 ' }, 'col')).toBe('#123456');
			expect(getEventColor({ col: 123 }, 'col')).toBeUndefined();
			expect(getEventColor({}, 'col')).toBeUndefined();
		});

		it('computes contrast color for short hex and rgba values', () => {
			expect(getContrastColor('#fff')).toBe('#000000');
			expect(getContrastColor('#000')).toBe('#ffffff');
			expect(getContrastColor('rgba(255, 255, 255, 1)')).toBe('#000000');
			expect(getContrastColor('rgba(0, 0, 0, 1)')).toBe('#ffffff');
		});
	});
});

describe('calendarLayout.setup', () => {
	beforeEach(() => {
		mockDarkMode.value = false;
		mockCalendarInstances.length = 0;
		capturedItemsOptions = null;

		const startField = createMockField('start_date', 'dateTime');
		const endField = createMockField('end_date', 'dateTime');
		const colorPickerField = createMockField('color', 'string', 'select-color');
		const stringField = createMockField('category', 'string');

		mockFieldsInCollection.value = [mockPrimaryKeyField.value!, startField, endField, colorPickerField, stringField];

		mockItems.value = [
			{
				id: 1,
				title: 'Meeting',
				start_date: '2026-06-01T10:00:00',
				end_date: '2026-06-01T11:00:00',
				color: '#ff0000',
			},
			{
				id: 2,
				title: 'Holiday',
				start_date: '2026-06-02T00:00:00',
				end_date: '2026-06-02T23:59:59',
				color: 'transparent',
			},
		];
	});

	it('computes and returns colorFields from fields in collection', () => {
		const props = createMockProps();
		const emit = vi.fn();

		const setupResult = calendarLayout.setup(props, { emit });

		expect(setupResult.colorFields.value).toEqual([
			mockFieldsInCollection.value[3],
			{ divider: true },
			{ header: 'other' },
			mockFieldsInCollection.value[4],
		]);
	});

	it('synchronizes colorField reactively and updates queryFields', () => {
		const props = createMockProps();
		const emit = vi.fn((event: string, value: any) => {
			if (event === 'update:layoutOptions') {
				props.layoutOptions = value;
			}
		});

		const setupResult = calendarLayout.setup(props, { emit });

		expect(setupResult.colorField.value).toBeUndefined();
		expect(capturedItemsOptions.fields.value).not.toContain('color');

		setupResult.colorField.value = 'color';

		expect(emit).toHaveBeenCalledWith('update:layoutOptions', expect.objectContaining({ colorField: 'color' }));
		expect(setupResult.colorField.value).toBe('color');
		expect(capturedItemsOptions.fields.value).toContain('color');
	});

	it('configures FullCalendar with eventDisplay block and applies event styling', async () => {
		const props = createMockProps({
			layoutOptions: {
				startDateField: 'start_date',
				endDateField: 'end_date',
				colorField: 'color',
				template: '{{ title }}',
			},
		});
		const emit = vi.fn((event: string, value: any) => {
			if (event === 'update:layoutOptions') {
				props.layoutOptions = value;
			}
		});

		const setupResult = calendarLayout.setup(props, { emit });

		const container = document.createElement('div');
		setupResult.createCalendar(container);

		expect(mockCalendarInstances.length).toBe(1);
		const calendarInstance = mockCalendarInstances[0];

		expect(calendarInstance.options.eventDisplay).toBe('block');
		expect(calendarInstance.options.views.dayGridMonth.eventDisplay).toBe('block');

		const events = calendarInstance.options.events;
		expect(events).toHaveLength(2);

		expect(events[0]).toMatchObject({
			id: 1,
			start: '2026-06-01T10:00:00',
			end: '2026-06-01T11:00:00',
			color: '#ff0000',
			textColor: '#ffffff',
			display: 'block',
		});

		expect(events[1]).toMatchObject({
			id: 2,
			start: '2026-06-02T00:00:00',
			end: '2026-06-02T23:59:59',
			color: 'transparent',
			textColor: '#000000',
			display: 'block',
		});
	});

	it('reactively updates event textColor when darkMode changes', async () => {
		const props = createMockProps({
			layoutOptions: {
				startDateField: 'start_date',
				endDateField: 'end_date',
				colorField: 'color',
				template: '{{ title }}',
			},
		});
		const emit = vi.fn();

		const setupResult = calendarLayout.setup(props, { emit });

		const container = document.createElement('div');
		setupResult.createCalendar(container);

		const calendarInstance = mockCalendarInstances[0];

		mockDarkMode.value = true;
		await nextTick();

		const resetOptionsCall = calendarInstance.resetOptions.mock.calls.at(-1);
		expect(resetOptionsCall).toBeDefined();

		const updatedEvents = resetOptionsCall[0].events;
		expect(updatedEvents[1]).toMatchObject({
			id: 2,
			color: 'transparent',
			textColor: '#ffffff',
			display: 'block',
		});
	});

	it('provides helper methods destroyCalendar, resize, resetPresetAndRefresh, and refresh', async () => {
		const props = createMockProps();
		const emit = vi.fn();

		const setupResult = calendarLayout.setup(props, { emit });

		const container = document.createElement('div');
		setupResult.createCalendar(container);

		const calendarInstance = mockCalendarInstances[0];

		setupResult.resize();
		expect(calendarInstance.updateSize).toHaveBeenCalled();

		setupResult.destroyCalendar();
		expect(calendarInstance.destroy).toHaveBeenCalled();

		await setupResult.resetPresetAndRefresh();
		expect(props.resetPreset).toHaveBeenCalled();
	});
});
