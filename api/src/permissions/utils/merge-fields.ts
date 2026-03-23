import { intersection, union } from 'lodash-es';

export function mergeFields(fieldsA: string[] | null, fieldsB: string[] | null, strategy: 'and' | 'or') {
	if (fieldsA === null) fieldsA = [];
	if (fieldsB === null) fieldsB = [];

	let fields = [];

	if (strategy === 'and') {
		if (fieldsA.length === 0 || fieldsB.length === 0) return [];
		if (fieldsA.includes('*')) return fieldsB;
		if (fieldsB.includes('*')) return fieldsA;

		fields = intersection(fieldsA, fieldsB);
	} else {
		if (fieldsA.length === 0) return fieldsB;
		if (fieldsB.length === 0) return fieldsA;

		if (fieldsA.includes('*') || fieldsB.includes('*')) return ['*'];

		fields = union(fieldsA, fieldsB);
	}

	if (fields.includes('*')) return ['*'];

	return fields;
}
