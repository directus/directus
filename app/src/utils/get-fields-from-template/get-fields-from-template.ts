import adjustFieldsForTranslations from '@/utils/adjust-fields-for-translations';

export default function getFieldsFromTemplate(string: string, collection: string | undefined = undefined) {
	const regex = /{{(.*?)}}/g;
	let fields = string.match(regex);

	if (!Array.isArray(fields)) {
		return [];
	}

	fields = fields.map((field) => {
		return field.replace(/{{/g, '').replace(/}}/g, '').trim();
	});

	if (collection) {
		return adjustFieldsForTranslations(fields, collection);
	}
	return fields;
}
