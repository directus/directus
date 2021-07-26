import { useUserStore } from '@/stores';
import { Filter } from '@directus/shared/types';

export function sanitizeFilters(filters: Filter[], values: Record<string, unknown> | null) {
	const output: Filter[] = [];
	const userStore = useUserStore();

	for (const filter of filters) {
		let val: unknown = filter.value;

		if (val === '$NOW') val = new Date();
		if (val === '$CURRENT_USER') val = userStore?.currentUser?.id || null;
		if (val === '$CURRENT_ROLE') val = userStore?.currentUser?.role?.id || null;

		const match = typeof val === 'string' ? /^\$VALUE\((.+?)\)$/.exec(val) : null;
		if (match !== null) {
			const field = match[1];
			if (!values) {
				// eslint-disable-next-line no-console
				console.warn('⚠️ It is not possible to apply the dynamic filter becouse the current item is not defined.');
			} else {
				val = values[field];
			}
		}

		output.push({
			...filter,
			value: val as any,
		});
	}

	return output;
}
