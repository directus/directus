export function getFieldsFromTemplate(template: string | null): string[] {
	if (template === null) return [];

	const regex = /{{(.*?)}}/g;
	let fields = template.match(regex);

	if (!Array.isArray(fields)) {
		return [];
	}

	fields = fields.map((field) => {
		return field.replace(/{{/g, '').replace(/}}/g, '').trim();
	});

	return fields as string[];
}
