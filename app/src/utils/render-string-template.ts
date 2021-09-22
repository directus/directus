import { render, renderFn, get } from 'micromustache';
import { computed, ComputedRef, Ref, unref } from 'vue';
import { getFieldsFromTemplate } from '@directus/shared/utils';

type StringTemplate = {
	fieldsInTemplate: ComputedRef<string[]>;
	displayValue: ComputedRef<string | false>;
};

function resolve(path: string, scope: any) {
	const value = get(scope, path);
	return typeof value === 'object' ? JSON.stringify(value) : value;
}

export function renderStringTemplate(
	template: Ref<string | null> | string,
	item: Record<string, any> | undefined | null | Ref<Record<string, any> | undefined | null>
): StringTemplate {
	const values = unref(item);

	const templateString = unref(template);

	const fieldsInTemplate = computed(() => getFieldsFromTemplate(templateString));

	const displayValue = computed(() => {
		if (!values || !templateString || !fieldsInTemplate.value) return false;

		try {
			return renderFn(templateString, resolve, values, { propsExist: true });
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
