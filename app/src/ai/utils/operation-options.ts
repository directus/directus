import type { DeepPartial, Field } from '@directus/types';

type Options = Record<string, unknown>;

/** VForm drops a field's key when it goes back to its default, so a missing key here means "use the default". */
export function applyFormValues(current: Options | null, formFields: Field[], formValues: Options): Options {
	const next = { ...current };

	for (const { field } of formFields) {
		if (field in formValues) next[field] = formValues[field];
		else delete next[field];
	}

	return next;
}

/** Adds picked file ids to a list. A `{{ }}` value from the raw editor isn't a list, so picking is off for it. */
export function mergeFileIds(current: unknown, ids: (string | number)[]): string[] {
	const list = Array.isArray(current) ? current.map(String) : [];
	return [...new Set([...list, ...ids.map(String)])];
}

/** Same `permissions` option as the item operations, with the AI operation's own note. */
export function getPermissionsField(note: string, hidden = false): DeepPartial<Field> {
	return {
		field: 'permissions',
		name: '$t:permissions',
		type: 'string',
		schema: { default_value: '$trigger' },
		meta: {
			note,
			width: 'half',
			interface: 'select-dropdown',
			hidden,
			options: {
				choices: [
					{ text: '$t:ai.flow_operations.permissions_trigger', value: '$trigger' },
					{ text: '$t:ai.flow_operations.permissions_public', value: '$public' },
					{ text: '$t:ai.flow_operations.permissions_full', value: '$full' },
				],
				allowOther: true,
			},
		},
	};
}
