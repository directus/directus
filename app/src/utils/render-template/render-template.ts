import { computed, ref, Ref } from '@vue/composition-api';
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

function renderTemplate(template: Ref<string | null> | string, item: Ref<Record<string, any> | null>) {
	const templateString = computed(() => (typeof template === 'string' ? template : template.value));

	const fieldsInTemplate = computed(() => getFieldsFromTemplate(templateString.value));

	const displayValue = computed(() => {
		if (!item.value || !templateString.value || !fieldsInTemplate.value) return;

		try {
			return render(templateString.value, item.value, { propsExist: true });
		} catch {}
	});

	return { fieldsInTemplate, displayValue };
}

export { getFieldsFromTemplate, renderTemplate };
