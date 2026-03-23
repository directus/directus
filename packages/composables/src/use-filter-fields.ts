import type { Field } from '@directus/types';
import type { ComputedRef, Ref } from 'vue';
import { computed } from 'vue';

/**
 * A Vue composable that filters and groups fields based on multiple filter criteria.
 *
 * @template T - The type of filter names as string literals
 * @param fields - A Vue ref containing an array of Field objects to be filtered
 * @param filters - An object where keys are filter names and values are predicate functions
 *                  that return true if a field should be included in that group
 *
 * @returns An object containing:
 *   - fieldGroups: ComputedRef<Record<Extract<T, string>, Field[]>> - A reactive object
 *     where each key corresponds to a filter name and the value is an array of fields
 *     that pass that filter
 *
 * @example
 * ```typescript
 * // Define filter criteria
 * const fieldFilters = {
 *   required: (field: Field) => field.required === true,
 *   optional: (field: Field) => field.required !== true,
 *   text: (field: Field) => field.type === 'string',
 *   numeric: (field: Field) => ['integer', 'float', 'decimal'].includes(field.type)
 * };
 *
 * const fieldsRef = ref<Field[]>([
 *   { name: 'id', type: 'integer', required: true },
 *   { name: 'title', type: 'string', required: true },
 *   { name: 'description', type: 'text', required: false },
 *   { name: 'price', type: 'decimal', required: false }
 * ]);
 *
 * const { fieldGroups } = useFilterFields(fieldsRef, fieldFilters);
 *
 * // Access filtered groups
 * console.log(fieldGroups.value.required); // [id, title]
 * console.log(fieldGroups.value.text); // [title]
 * console.log(fieldGroups.value.numeric); // [id, price]
 * ```
 *
 * @remarks
 * - Fields can appear in multiple groups if they pass multiple filters
 * - If a field doesn't pass any filter, it won't appear in any group
 * - The result is reactive and will update when the input fields change
 * - Filter functions are called for each field against each filter criterion
 * - Groups are initialized as empty arrays even if no fields match the criteria
 */
export function useFilterFields<T extends string>(
	fields: Ref<Field[]>,
	filters: Record<T, (field: Field) => boolean>,
): { fieldGroups: ComputedRef<Record<Extract<T, string>, Field[]>> } {
	const fieldGroups = computed(() => {
		const acc = {} as Record<Extract<T, string>, Field[]>;

		for (const name in filters) {
			acc[name] = [];
		}

		return fields.value.reduce((acc, field) => {
			for (const name in filters) {
				if (filters[name](field) === false) continue;
				acc[name].push(field);
			}

			return acc;
		}, acc);
	});

	return { fieldGroups };
}
