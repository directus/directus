import { computed, Ref } from '@vue/composition-api';
import { render } from 'micromustache';

function getFieldsFromTemplate(template: string | null) {
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

function renderTemplate(template: Ref<string | null>, item: Ref<Record<string, any> | null>) {
	const fieldsInTemplate = computed(() => getFieldsFromTemplate(template.value));

	const displayValue = computed(() => {
		if (!item.value || !template.value || !fieldsInTemplate.value) return;

		for (const [key, value] of Object.entries(item.value)) {
			if (fieldsInTemplate.value.includes(key) === false) continue;

			if (value === undefined) return null;
		}

		return render(template.value, item.value);
	});

	return { fieldsInTemplate, displayValue };
}

export { getFieldsFromTemplate, renderTemplate };
