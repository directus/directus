import { Field } from '@directus/types';
import { createTestingPinia } from '@pinia/testing';
import { merge } from 'lodash';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useFieldsStore } from './fields';
import { i18n } from '@/lang';
import { translate as translateLiteral } from '@/utils/translate-literal';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		}),
	);
});

afterEach(() => {
	vi.clearAllMocks();
});

const mockField = {
	collection: 'a',
	field: 'name',
	type: 'string',
	schema: {},
	meta: {
		collection: 'a',
		field: 'name',
		options: null,
		display_options: null,
		note: 'note',
		validation_message: null,
	},
} as Field;

vi.mock('@/api', () => {
	return {
		default: {
			get: (path: string) => {
				if (path === '/fields') {
					return Promise.resolve({
						data: {
							data: [mockField],
						},
					});
				}

				return Promise.reject(new Error(`Path "${path}" is not mocked in this test`));
			},
		},
	};
});

vi.mock('@/utils/translate-literal', () => {
	return {
		translate: vi.fn(),
	};
});

describe('hydrate action', () => {
	test('should not skip translations by default', async () => {
		const fieldsStore = useFieldsStore();
		await fieldsStore.hydrate();

		expect(translateLiteral).toHaveBeenCalledWith('note');
	});

	test('should skip translations when skipTranslation is true', async () => {
		const fieldsStore = useFieldsStore();
		await fieldsStore.hydrate({ skipTranslation: true });

		expect(translateLiteral).not.toHaveBeenCalledWith('note');
	});
});

describe('parseField action', () => {
	test('should translate field name when translations are added then removed', async () => {
		const fieldsStore = useFieldsStore();

		const mockFieldWithTranslations = merge({}, mockField, {
			meta: {
				translations: [
					{
						language: 'en-US',
						translation: 'Name en-US',
					},
				],
			},
		});

		fieldsStore.fields = [mockFieldWithTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('Name en-US');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(true);

		const mockFieldWithoutTranslations = merge({}, mockField, {
			meta: {
				translations: [
					{
						language: 'zh-CN',
						translation: 'Name zh-CN',
					},
				],
			},
		});

		fieldsStore.fields = [mockFieldWithoutTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('Name');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(false);
	});

	test('should translate field name when translations are added and reset when removed', async () => {
		const fieldsStore = useFieldsStore();

		const mockFieldWithTranslations = merge({}, mockField, {
			meta: {
				translations: [
					{
						language: 'en-US',
						translation: 'name en-US',
					},
				],
			},
		});

		fieldsStore.fields = [mockFieldWithTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('name en-US');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(true);

		const mockFieldWithoutTranslations = merge({}, mockField, {
			meta: {
				translations: null,
			},
		});

		fieldsStore.fields = [mockFieldWithoutTranslations].map(fieldsStore.parseField);
		expect(fieldsStore.fields[0].name).toEqual('Name');
		expect(i18n.global.te(`fields.${mockField.collection}.${mockField.field}`)).toBe(false);
	});

	test('should normalize required and readonly to false for presentation fields', () => {
		const fieldsStore = useFieldsStore();

		const presentationField = {
			collection: 'a',
			field: 'divider',
			type: 'alias',
			schema: null,
			meta: {
				collection: 'a',
				field: 'divider',
				interface: 'presentation-divider',
				special: ['alias', 'no-data'],
				options: null,
				display_options: null,
				note: null,
				validation_message: null,
				required: true,
				readonly: true,
			},
		} as unknown as Field;

		const parsed = fieldsStore.parseField(presentationField);

		expect(parsed.meta?.required).toBe(false);
		expect(parsed.meta?.readonly).toBe(false);
	});

	test('should not touch required or readonly on group (alias + no-data + group) fields', () => {
		const fieldsStore = useFieldsStore();

		const groupField = {
			collection: 'a',
			field: 'my_group',
			type: 'alias',
			schema: null,
			meta: {
				collection: 'a',
				field: 'my_group',
				interface: 'group-raw',
				special: ['alias', 'no-data', 'group'],
				options: null,
				display_options: null,
				note: null,
				validation_message: null,
				required: true,
				readonly: true,
			},
		} as unknown as Field;

		const parsed = fieldsStore.parseField(groupField);

		expect(parsed.meta?.required).toBe(true);
		expect(parsed.meta?.readonly).toBe(true);
	});

	test('should not touch required or readonly on relational alias fields', () => {
		const fieldsStore = useFieldsStore();

		const o2mField = {
			collection: 'a',
			field: 'children',
			type: 'alias',
			schema: null,
			meta: {
				collection: 'a',
				field: 'children',
				interface: 'list-o2m',
				special: ['o2m'],
				options: null,
				display_options: null,
				note: null,
				validation_message: null,
				required: true,
				readonly: false,
			},
		} as unknown as Field;

		const parsed = fieldsStore.parseField(o2mField);

		expect(parsed.meta?.required).toBe(true);
		expect(parsed.meta?.readonly).toBe(false);
	});
});
