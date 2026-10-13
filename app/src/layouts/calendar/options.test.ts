import { mount } from '@vue/test-utils';
import { beforeAll, expect, test, vi } from 'vitest';
import { createI18n, I18n } from 'vue-i18n';
import Options from './options.vue';
import { getContrastColor, getEventColor } from './index';
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

test('should extract event color and compute contrast textColor when colorField is configured', () => {
	const item1 = { color: '#3b82f6' };
	const color1 = getEventColor(item1, 'color');
	expect(color1).toBe('#3b82f6');
	expect(getContrastColor(color1!)).toBe('#ffffff');

	const item2 = { color: '  #ffff00  ' };
	const color2 = getEventColor(item2, 'color');
	expect(color2).toBe('#ffff00');
	expect(getContrastColor(color2!)).toBe('#000000');

	const item3 = { color: '#000000' };
	const color3 = getEventColor(item3, 'color');
	expect(color3).toBe('#000000');
	expect(getContrastColor(color3!)).toBe('#ffffff');

	const item4 = { color: '#ffffff' };
	const color4 = getEventColor(item4, 'color');
	expect(color4).toBe('#ffffff');
	expect(getContrastColor(color4!)).toBe('#000000');
});

test('should return undefined when colorField is undefined or null', () => {
	expect(getEventColor({ color: '#3b82f6' }, undefined)).toBeUndefined();
	expect(getEventColor({ color: '#3b82f6' }, null)).toBeUndefined();
});

test('should return undefined when item field is missing', () => {
	expect(getEventColor({}, 'color')).toBeUndefined();
});

test('should return undefined when item field has non-string values', () => {
	expect(getEventColor({ color: 123 }, 'color')).toBeUndefined();
	expect(getEventColor({ color: null }, 'color')).toBeUndefined();
	expect(getEventColor({ color: true }, 'color')).toBeUndefined();
	expect(getEventColor({ color: {} }, 'color')).toBeUndefined();
});

test('should return undefined when item field is empty string or only whitespace', () => {
	expect(getEventColor({ color: '' }, 'color')).toBeUndefined();
	expect(getEventColor({ color: '   ' }, 'color')).toBeUndefined();
});

