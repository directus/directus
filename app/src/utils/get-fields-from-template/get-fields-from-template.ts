export default function getFieldsFromTemplate(string: string) {
	const regex = /{{(.*?)}}/g;
	let fields = string.match(regex);

	if (!Array.isArray(fields)) {
		return [];
	}

	fields = fields.map((field) => {
		return field.replace(/{{/g, '').replace(/}}/g, '').trim();
	});
	return fields;
}
