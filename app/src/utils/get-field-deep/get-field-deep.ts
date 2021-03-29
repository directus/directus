import { useFieldsStore, useRelationsStore } from '@/stores/';
import { Relation } from '@/types';

export default function getFieldDeep(collection: string, field: string) {
	const relationsStore = useRelationsStore();
	const fieldStore = useFieldsStore();
	const fields = field.split('.');

	const deepCollection = getFieldDeepRecursive(collection, fields);

	return fieldStore.getField(deepCollection, fields[0]);

	function getFieldDeepRecursive(collection: string, fields: string[]): string {
		if (fields.length === 1) return collection;

		const field = fields.shift();
		const relations = relationsStore.getRelationsForField(collection, field) as Relation[];

		const relatedCollection = relations
			.map((relation) => {
				if (relation.many_collection === collection && relation.many_field === field) {
					return relation.one_collection;
				} else if (relation.one_collection === collection && relation.one_field === field) {
					return relation.many_collection;
				} else {
					return undefined;
				}
			})
			.filter((f) => f)[0] as string;

		return getFieldDeepRecursive(relatedCollection, fields);
	}
}
