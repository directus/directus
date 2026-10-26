import type { Field, Item, LayoutProps } from '@directus/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive, ref, type Ref } from 'vue';
import type { LayoutOptions } from './types';
import calendarLayout, { getEventStyling } from './index';

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

function createMockField(field: string, type: Field['type'], interfaceType?: string): Field {
	return {
		collection: 'events',
		field,
		name: field,
		type,
		schema: null,
		meta: interfaceType ? ({ interface: interfaceType } as any) : null,
	};
}

type CalendarSetupResult = {
	colorFields: Ref<Field[]>;
	colorField: Ref<string | undefined>;
	createCalendar: (el: HTMLElement) => void;
};

function setupCalendar(props: LayoutProps<LayoutOptions>, emit: (event: string, ...args: any[]) => void) {
	return calendarLayout.setup(props, { emit }) as unknown as CalendarSetupResult;
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
	}) as unknown as LayoutProps<LayoutOptions>;
}

describe('getEventStyling', () => {
	it('returns no color or textColor without a colorField or value', () => {
		const empty = { color: undefined, textColor: undefined, display: 'block' };

		expect(getEventStyling({ id: 1, color: '#ff0000' }, undefined)).toEqual(empty);
		expect(getEventStyling({ id: 1 }, 'color')).toEqual(empty);
		expect(getEventStyling({ id: 1, color: null }, 'color')).toEqual(empty);
	});

	it('returns color with a contrasting textColor', () => {
		expect(getEventStyling({ id: 1, color: '#ffffff' }, 'color')).toEqual({
			color: '#ffffff',
			textColor: '#000000',
			display: 'block',
		});

		expect(getEventStyling({ id: 1, color: '#6644FF' }, 'color')).toEqual({
			color: '#6644FF',
			textColor: '#ffffff',
			display: 'block',
		});
	});

	it('returns undefined textColor for unparseable colors', () => {
		expect(getEventStyling({ id: 1, color: 'invalid-color' }, 'color')).toEqual({
			color: 'invalid-color',
			textColor: undefined,
			display: 'block',
		});
	});
});

describe('calendarLayout.setup', () => {
	beforeEach(() => {
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
				color: '#ffffff',
			},
		];
	});

	it('offers only select-color fields as colorFields', () => {
		const props = createMockProps();
		const emit = vi.fn();

		const setupResult = setupCalendar(props, emit);

		expect(setupResult.colorFields.value).toEqual([mockFieldsInCollection.value[3]]);
	});

	it('synchronizes colorField reactively and updates queryFields', () => {
		const props = createMockProps();

		const emit = vi.fn((event: string, value: any) => {
			if (event === 'update:layoutOptions') {
				props.layoutOptions = value;
			}
		});

		const setupResult = setupCalendar(props, emit);

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

		const setupResult = setupCalendar(props, emit);

		const container = document.createElement('div');
		setupResult.createCalendar(container);

		expect(mockCalendarInstances.length).toBe(1);
		const calendarInstance = mockCalendarInstances[0];

		expect(calendarInstance.options.eventDisplay).toBe('block');

		expect(calendarInstance.options.events[0]).toMatchObject({ color: '#ff0000', textColor: '#ffffff' });
	});
});
