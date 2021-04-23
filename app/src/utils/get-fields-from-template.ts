import adjustFieldsForTranslations from '@/utils/adjust-fields-for-translations';

export function getFieldsFromTemplate(template: string | null, collection: string | undefined = undefined) {
	if (template === null) return [];

	const regex = /{{(.*?)}}/g;
	let fields = template.match(regex);

	if (!Array.isArray(fields)) {
		return [];
	}

	fields = fields.map((field) => {
		return field.replace(/{{/g, '').replace(/}}/g, '').trim();
	});

	if (collection) {
		return adjustFieldsForTranslations(fields, collection);
	}

	return fields as string[];
}
