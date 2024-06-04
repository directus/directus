import { isNil } from 'lodash-es';

export function getFieldsFromTemplate(template?: string | null): string[] {
	if (isNil(template)) return [];

	const regex = /{{(.*?)}}/g;
	const fields = template.match(regex);

	if (!Array.isArray(fields)) {
		return [];
	}

	return fields.map((field) => {
		return field.replace(/{{/g, '').replace(/}}/g, '').trim();
	});
}
