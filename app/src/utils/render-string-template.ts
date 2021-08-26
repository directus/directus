import { cloneDeep } from 'lodash';
import { render } from 'micromustache';
import { computed, ComputedRef, Ref, unref } from 'vue';
import { getFieldsFromTemplate } from './get-fields-from-template';

type StringTemplate = {
	fieldsInTemplate: ComputedRef<string[]>;
	displayValue: ComputedRef<string | false>;
};

export function renderStringTemplate(
	template: Ref<string | null> | string,
	item: Record<string, any> | undefined | null | Ref<Record<string, any> | undefined | null>
): StringTemplate {
	const values = cloneDeep(unref(item));

	for (const key in values) {
		if (typeof values[key] === 'object') values[key] = JSON.stringify(values[key]);
	}

	const templateString = unref(template);

	const fieldsInTemplate = computed(() => getFieldsFromTemplate(templateString));

	const displayValue = computed(() => {
		if (!values || !templateString || !fieldsInTemplate.value) return false;

		try {
			return render(templateString, values, { propsExist: true });
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
