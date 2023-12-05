import type { DeepPartial, Field } from '@directus/types';
import { expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { getFormFields } from './get-form-fields';
import * as useExtension from '@/composables/use-extension';

vi.mock('@/utils/get-default-interface-for-type', () => ({
	getDefaultInterfaceForType: () => 'input',
}));

it('should not mutate', () => {
	const fields: Field[] = [];

	const formFields = getFormFields(ref(fields));

	expect(formFields).not.toBe(fields);
});

it('should filter out fake fields', () => {
	const fields: DeepPartial<Field>[] = [
		{
			field: '$thumbnail',
		},
	];

	const formFields = getFormFields(ref(fields as Field[]));

	expect(formFields.value).toEqual([]);
});

it('should set default interface', () => {
	vi.spyOn(useExtension, 'useExtension').mockImplementationOnce(() => ref(null));

	const fields: DeepPartial<Field>[] = [
		{
			field: 'field1',
			meta: {},
		},
	];

	const formFields = getFormFields(ref(fields as Field[]));

	expect(formFields.value[0]).toEqual(expect.objectContaining({ meta: { interface: 'input' } }));
});

it('should inherit config from interface', () => {
	vi.spyOn(useExtension, 'useExtension').mockImplementationOnce(() => ref({ hideLabel: true, hideLoader: true }));

	const fields: DeepPartial<Field>[] = [
		{
			field: 'field1',
			meta: { interface: 'example' },
		},
	];

	const formFields = getFormFields(ref(fields as Field[]));

	expect(formFields.value[0]).toEqual(
		expect.objectContaining({ meta: { interface: 'example' }, hideLabel: true, hideLoader: true }),
	);
});
