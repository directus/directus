import type { DeepPartial, Field } from '@directus/types';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useFormFields } from './use-form-fields';

vi.mock('@/utils/get-default-interface-for-type', () => ({
	getDefaultInterfaceForType: () => 'input',
}));

vi.mock('@/utils/translate-object-values', () => ({ translate: (obj: Record<string, unknown>) => obj }));

vi.mock('./use-extension', () => ({
	useExtension: () => ({
		value: null,
	}),
}));

describe('field width calculation', () => {
	it('should detect and update right aligned fields', () => {
		const fields: DeepPartial<Field>[] = [
			{
				field: 'field1',
				meta: {
					id: 1,
					interface: 'input',
					hidden: false,
					sort: 1,
					width: 'half',
					group: null,
				},
			},
			{
				field: 'field2',
				meta: {
					id: 2,
					interface: 'input',
					hidden: false,
					sort: 2,
					width: 'half',
					group: null,
				},
			},
		];

		const { formFields } = useFormFields(ref(fields as Field[]));

		expect(formFields.value).toMatchInlineSnapshot(`
			[
			  {
			    "field": "field1",
			    "meta": {
			      "group": null,
			      "hidden": false,
			      "id": 1,
			      "interface": "input",
			      "sort": 1,
			      "width": "half",
			    },
			  },
			  {
			    "field": "field2",
			    "meta": {
			      "group": null,
			      "hidden": false,
			      "id": 2,
			      "interface": "input",
			      "sort": 2,
			      "width": "half-right",
			    },
			  },
			]
		`);
	});

	it('should only consider previous fields from same group', () => {
		const fields: DeepPartial<Field>[] = [
			{
				// field2 appears before field1 because it's deeper nested
				field: 'field2',
				meta: {
					id: 2,
					interface: 'input',
					hidden: false,
					sort: 1,
					width: 'half',
					// raw1 is inside detail1
					group: 'raw1',
				},
			},
			{
				field: 'field1',
				meta: {
					id: 1,
					interface: 'input',
					hidden: false,
					sort: 1,
					width: 'half',
					group: 'detail1',
				},
			},
		];

		const { formFields } = useFormFields(ref(fields as Field[]));

		expect(formFields.value).toMatchInlineSnapshot(`
			[
			  {
			    "field": "field2",
			    "meta": {
			      "group": "raw1",
			      "hidden": false,
			      "id": 2,
			      "interface": "input",
			      "sort": 1,
			      "width": "half",
			    },
			  },
			  {
			    "field": "field1",
			    "meta": {
			      "group": "detail1",
			      "hidden": false,
			      "id": 1,
			      "interface": "input",
			      "sort": 1,
			      "width": "half",
			    },
			  },
			]
		`);
	});
});
