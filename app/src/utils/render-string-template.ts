import { render } from 'micromustache';
import { computed, ComputedRef, Ref } from 'vue';
import { getFieldsFromTemplate } from './get-fields-from-template';

type StringTemplate = {
	fieldsInTemplate: ComputedRef<string[]>;
	displayValue: ComputedRef<string | false>;
};

export function renderStringTemplate(
	template: Ref<string | null> | string,
	item: Ref<Record<string, any> | undefined | null>
): StringTemplate {
	const templateString = computed(() => (typeof template === 'string' ? template : template.value));

	const fieldsInTemplate = computed(() => getFieldsFromTemplate(templateString.value));

	const displayValue = computed(() => {
		if (!item.value || !templateString.value || !fieldsInTemplate.value) return false;

		try {
			return render(templateString.value, item.value, { propsExist: true });
		} catch {
			return false;
		}
	});

	return { fieldsInTemplate, displayValue };
}

export function renderPlainStringTemplate(template: string, item?: Record<string, any> | null): string | null {
	const fieldsInTemplate = getFieldsFromTemplate(template);

	if (!item || !template || !fieldsInTemplate) return null;

	try {
		return render(template, item, { propsExist: true });
	} catch {
		return null;
	}
}
