import type { DeepPartial, Field } from '@directus/types';
import { cloneDeep } from 'lodash';
import { expect, it } from 'vitest';
import { updateSystemDivider } from './update-system-divider';

const mockFields: DeepPartial<Field>[] = [
	{ field: 'system_field', meta: { system: true } },
	{ field: '$system_divider', meta: {} },
	{ field: 'user_field', meta: {} },
];

it('should show/reveal system divider with visible system and user fields', () => {
	const fields = cloneDeep(mockFields);

	updateSystemDivider(fields as Field[]);

	expect(fields).toContainEqual({
		field: '$system_divider',
		meta: { hidden: false },
	});
});

it('should hide system divider when no visible system fields', () => {
	const fields = cloneDeep(mockFields);
	fields[0]!.meta!.hidden = true;

	updateSystemDivider(fields as Field[]);

	expect(fields).toContainEqual({
		field: '$system_divider',
		meta: { hidden: true },
	});
});

it('should hide system divider when no visible user fields', () => {
	const fields = cloneDeep(mockFields);
	fields[2]!.meta!.hidden = true;

	updateSystemDivider(fields as Field[]);

	expect(fields).toContainEqual({
		field: '$system_divider',
		meta: { hidden: true },
	});
});
