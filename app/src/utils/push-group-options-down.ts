import { Field, FieldMeta } from '@directus/types';
import { cloneDeep } from 'lodash';

export function pushGroupOptionsDown(fields: Field[]) {
	fields = cloneDeep(fields);

	const updatedGroups: string[] = [];
	const fieldsQueue: Field[] = [...fields];

	while (fieldsQueue.length > 1) {
		const field = fieldsQueue.shift();

		if (!field) break;

		const parent = field?.meta?.group;
		const isGroup = field.meta?.special?.includes('group');

		if (!isGroup) continue;

		if (parent && !updatedGroups.includes(parent)) {
			fieldsQueue.push(field);
			continue;
		}

		for (const childField of fields) {
			if (childField.meta?.group !== field.field) continue;

			childField.meta.required = field.meta?.required || childField.meta.required;
			childField.meta.readonly = field.meta?.readonly || childField.meta.readonly;
		}

		if (!field.meta) {
			field.meta = {} as FieldMeta;
		}

		field.meta.required = false;
		field.meta.readonly = false;
		updatedGroups.push(field.field);
	}

	return fields;
}
