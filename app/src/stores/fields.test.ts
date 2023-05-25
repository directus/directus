import { translate as translateLiteral } from '@/utils/translate-literal';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { i18n } from '@/lang';
import { Field } from '@directus/types';
import { merge } from 'lodash';
import { useFieldsStore } from './fields';

beforeEach(() => {
	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
			stubActions: false,
		})
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
});
