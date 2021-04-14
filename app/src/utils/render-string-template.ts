import { computed, Ref } from '@vue/composition-api';
import { render } from 'micromustache';
import { getFieldsFromTemplate } from './get-fields-from-template';

export function renderStringTemplate(
	template: Ref<string | null> | string,
	item: Ref<Record<string, any> | undefined | null>
) {
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
