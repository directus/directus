import { Field } from '@directus/types';
import { Ref, unref, computed, ComputedRef } from 'vue';

export function getDefaultValuesFromFields(fields: Field[] | Ref<Field[]>): ComputedRef<Record<string, any>> {
	return computed(() => {
		return unref(fields).reduce(function (acc, field) {
			if (
				field.schema?.default_value !== undefined &&
				// Ignore autoincremented integer PK field
				!(
					field.schema.is_primary_key &&
					field.schema.data_type === 'integer' &&
					typeof field.schema.default_value === 'string'
				)
			) {
				acc[field.field] = field.schema.default_value;
			}

			return acc;
		}, {} as Record<string, any>);
	});
}
