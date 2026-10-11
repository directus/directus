import { mount } from '@vue/test-utils';
import { beforeAll, expect, test, vi } from 'vitest';
import { createI18n, I18n } from 'vue-i18n';
import { getContrastColor } from './index';
import Options from './options.vue';
import { GlobalMountOptions } from '@/__utils__/types';

let i18n: I18n;
let global: GlobalMountOptions;

beforeAll(() => {
	i18n = createI18n({
		legacy: false,
	});

	// silences locale message not found warnings
	vi.spyOn(i18n.global, 't').mockImplementation((key: string) => key);

	global = {
		stubs: ['v-collection-field-template', 'v-select'],
		plugins: [i18n],
	};
});

test('should have days array in firstDayOptions variable', async () => {
	const wrapper = mount(Options, {
		props: {
			collection: 'test',
			dateFields: [
				{
					collection: 'test',
					field: 'test',
					name: 'Test',
					type: 'date',
					schema: null,
					meta: null,
				},
			],
		},
		shallow: true,
		global,
	});

	const expected = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	expect(wrapper.vm.firstDayOptions.map((option: { text: string; value: number }) => option.text)).toEqual(expected);
});

test('should bind colorField prop and colorFields in Options component', () => {
	const colorFields = [
		{
			collection: 'test',
			field: 'color',
			name: 'Color',
			type: 'string',
			schema: null,
			meta: null,
		},
	];

	const wrapper = mount(Options, {
		props: {
			collection: 'test',
			dateFields: [],
			colorFields,
			colorField: 'color',
		},
		shallow: true,
		global,
	});

	expect(wrapper.vm.colorFieldWritable).toBe('color');
});

test('should compute contrast textColor using YIQ formula', () => {
	expect(getContrastColor('#ffffff')).toBe('#000000');
	expect(getContrastColor('#ffff00')).toBe('#000000');
	expect(getContrastColor('#fff')).toBe('#000000');
	expect(getContrastColor('#000000')).toBe('#ffffff');
	expect(getContrastColor('#0000ff')).toBe('#ffffff');
	expect(getContrastColor('#000')).toBe('#ffffff');
	expect(getContrastColor('#3b82f6')).toBe('#ffffff');
	expect(getContrastColor('rgb(255, 255, 255)')).toBe('#000000');
	expect(getContrastColor('rgb(0, 0, 0)')).toBe('#ffffff');
	expect(getContrastColor('invalid')).toBe('#ffffff');
});

test('should extract event color and textColor when colorField is configured', () => {
	const parseEventColor = (item: Record<string, unknown>, colorField?: string) => {
		const eventColor =
			colorField &&
			typeof item[colorField] === 'string' &&
			(item[colorField] as string).trim().length > 0
				? (item[colorField] as string).trim()
				: undefined;

		const textColor = eventColor ? getContrastColor(eventColor) : undefined;

		return { color: eventColor, textColor };
	};

	expect(parseEventColor({ color: '#3b82f6' }, 'color')).toEqual({
		color: '#3b82f6',
		textColor: '#ffffff',
	});
	expect(parseEventColor({ color: '  #ffff00  ' }, 'color')).toEqual({
		color: '#ffff00',
		textColor: '#000000',
	});
	expect(parseEventColor({ color: '#000000' }, 'color')).toEqual({
		color: '#000000',
		textColor: '#ffffff',
	});
	expect(parseEventColor({ color: '#ffffff' }, 'color')).toEqual({
		color: '#ffffff',
		textColor: '#000000',
	});
});

test('should return undefined when colorField is undefined or item field is missing/empty', () => {
	const parseEventColor = (item: Record<string, unknown>, colorField?: string) => {
		const eventColor =
			colorField &&
			typeof item[colorField] === 'string' &&
			(item[colorField] as string).trim().length > 0
				? (item[colorField] as string).trim()
				: undefined;

		const textColor = eventColor ? getContrastColor(eventColor) : undefined;

		return { color: eventColor, textColor };
	};

	expect(parseEventColor({ color: '#3b82f6' }, undefined)).toEqual({
		color: undefined,
		textColor: undefined,
	});
	expect(parseEventColor({}, 'color')).toEqual({
		color: undefined,
		textColor: undefined,
	});
	expect(parseEventColor({ color: '   ' }, 'color')).toEqual({
		color: undefined,
		textColor: undefined,
	});
	expect(parseEventColor({ color: null }, 'color')).toEqual({
		color: undefined,
		textColor: undefined,
	});
	expect(parseEventColor({ color: 123 }, 'color')).toEqual({
		color: undefined,
		textColor: undefined,
	});
});
