export const formatFields = (fields: (string | Record<string, any>)[]): string[] => {
	type FieldItem = (typeof fields)[number];

	const walkFields = (value: FieldItem, chain: string[] = []): string | string[] => {
		if (typeof value === 'object') {
			const result = [];

			for (const key in value) {
				const nestedField = value[key as keyof typeof value] ?? [];

				if (Array.isArray(nestedField)) {
					// regular nested fields
					for (const item of nestedField) {
						result.push(walkFields(item as FieldItem, [...chain, key]));
					}
				} else if (typeof nestedField === 'object') {
					// many to any nested
					for (const scope of Object.keys(nestedField)) {
						const fields = (nestedField as Record<string, FieldItem[]>)[scope]!;

						for (const item of fields) {
							result.push(walkFields(item as FieldItem, [...chain, `${key}:${scope}`]));
						}
					}
				}
			}

			return result.flatMap((items) => items);
		}

		return [...chain, String(value)].join('.');
	};

	return fields.flatMap((value) => walkFields(value));
};
