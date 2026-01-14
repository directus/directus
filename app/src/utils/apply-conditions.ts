import { Field, ContentVersion } from '@directus/types';
import { parseFilter } from '@/utils/parse-filter';
import { validatePayload } from '@directus/utils';
import { isArray, mergeWith } from 'lodash';

export interface ApplyConditionsOptions {
	/** The current item/record values */
	item: Record<string, any>;
	/** The field to apply conditions to */
	field: Field;
	/** Content version for $version variable support */
	version?: ContentVersion | null;
	/**
	 * Parent form values for $form variable support.
	 * Used when evaluating conditions in nested forms (e.g., junction drawers)
	 * where the condition references parent form data that hasn't been persisted yet.
	 */
	parentFormValues?: Record<string, any> | null;
}

/**
 * Apply field conditions to determine field visibility, readonly state, etc.
 *
 * Supports the following context variables in condition rules:
 * - Direct field references: Field values from the current item
 * - $version: The current content version name
 * - $form: Parent form values (for nested forms in junction drawers)
 *
 * @example
 * // Condition rule referencing parent form:
 * // { "$form.program": { "_eq": "some-program-id" } }
 *
 * @param item - Current item values
 * @param field - Field to apply conditions to
 * @param version - Content version (optional)
 * @param parentFormValues - Parent form values for $form variable (optional)
 */
export function applyConditions(
	item: Record<string, any>,
	field: Field,
	version: ContentVersion | null = null,
	parentFormValues: Record<string, any> | null = null,
) {
	if (field.meta && Array.isArray(field.meta?.conditions)) {
		const conditions = [...field.meta.conditions].reverse();

		const matchingCondition = conditions.find((condition) => {
			if (!condition.rule || Object.keys(condition.rule).length !== 1) return;

			// Build validation context with special variables:
			// - Direct field values from item
			// - $version for content versioning
			// - $form for parent form values (allows conditions like "$form.program")
			const validationContext = {
				...item,
				$version: version?.name ?? null,
				$form: parentFormValues ?? {},
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
