import { Field } from '@directus/types';
import { parseFilter } from '@/utils/parse-filter';
import { validatePayload } from '@directus/utils';
import { merge } from 'lodash';

export function applyConditions(item: Record<string, any>, field: Field) {
	if (field.meta && Array.isArray(field.meta?.conditions)) {
		const conditions = [...field.meta.conditions].reverse();

		const matchingCondition = conditions.find((condition) => {
			if (!condition.rule || Object.keys(condition.rule).length !== 1) return;
			const rule = parseFilter(condition.rule);
			const errors = validatePayload(rule, item, { requireAll: true });
			return errors.length === 0;
		});

		if (matchingCondition) {
			return {
				...field,
				meta: merge({}, field.meta || {}, {
					readonly: matchingCondition.readonly,
					options: matchingCondition.options,
					hidden: matchingCondition.hidden,
					required: matchingCondition.required,
				}),
			};
		}

		return field;
	} else {
		return field;
	}
}
