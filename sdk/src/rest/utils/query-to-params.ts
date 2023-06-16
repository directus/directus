import type { Query } from '../../types/index.js';

export const queryToParams = <Schema extends object, Item extends object>(
	query: Query<Schema, Item>
): Record<string, string> => {
	const params: Record<string, string> = {};

	if (query.fields) {
		type FieldItem = (typeof query.fields)[number];

		const walkFields = (value: FieldItem, chain: string[] = []): string => {
			if (typeof value === 'object') {
				const result = [];

				for (const key in value) {
					const fieldList = value[key as keyof typeof value] ?? [];

					for (const item of fieldList) {
						result.push(walkFields(item as FieldItem, [...chain, key]));
					}
				}

				return result.join('.');
			}

			return [...chain, String(value)].join('.');
		};

		params['fields'] = query.fields.flatMap((value) => walkFields(value)).join(',');
	}

	return params;
};
