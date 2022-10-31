import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';

import { i18n } from '@/lang';
import { Field } from '@directus/shared/types';
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
		note: null,
		validation_message: null,
	},
} as Field;

test('parseField action should translate field name when translations are added then removed', async () => {
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

test('parseField action should translate field name when translations are added and reset when removed', async () => {
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
