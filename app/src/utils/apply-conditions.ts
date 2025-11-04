import { Field, ContentVersion } from '@directus/types';
import { parseFilter } from '@/utils/parse-filter';
import { validatePayload } from '@directus/utils';
import { isArray, mergeWith } from 'lodash';

export function applyConditions(item: Record<string, any>, field: Field, version: ContentVersion | null = null) {
	if (field.meta && Array.isArray(field.meta?.conditions)) {
		const conditions = [...field.meta.conditions].reverse();

		const matchingCondition = conditions.find((condition) => {
			if (!condition.rule || Object.keys(condition.rule).length !== 1) return;

			// because $version is not an item field, we need to add it to the validation context
			const validationContext = {
				...item,
				$version: version?.name ?? null,
			};

			const rule = parseFilter(condition.rule);
			const errors = validatePayload(rule, validationContext, { requireAll: true });
			return errors.length === 0;
		});

		if (matchingCondition) {
			const updatedField = {
				...field,
				meta: mergeWith(
					{},
					field.meta || {},
					{
						readonly: matchingCondition.readonly,
						options: matchingCondition.options,
						hidden: matchingCondition.hidden,
						required: matchingCondition.required,
						clear_hidden_value_on_save: matchingCondition.clear_hidden_value_on_save,
					},
					(objValue, srcValue) => {
						if (isArray(objValue) && isArray(srcValue)) {
							return srcValue;
						}

						return undefined;
					},
				),
			};

			return updatedField;
		}
	}

	return field;
}
