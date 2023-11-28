import type { Field } from '@directus/types';
import type { ComputedRef, Ref } from 'vue';
import { computed } from 'vue';

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
