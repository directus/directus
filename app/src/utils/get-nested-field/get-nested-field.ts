import { useFieldsStore, useRelationsStore } from '@/stores';
import i18n from '@/lang';
import { Relation } from '@/types';
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

export default function getNestedField(item: any, path: string, collection: string): any {
	const splitPath = path.split('.');
	const pathBefore = [];
	while (item) {
		const key = splitPath.shift();
		if (!key) {
			break;
		}
		pathBefore.push(key);
		item = item[key];
		if (Array.isArray(item)) {
			const field = fieldsStore.getField(collection, pathBefore.join('.'));
			if (field.type === 'translations') {
				const relations: Relation[] = relationsStore.getRelationsForField(field.collection, field.field);
				const translationsRelation = relations.find(
					(relation) => relation.one_collection === field.collection && relation.one_field === field.field
				);
				if (!translationsRelation) {
					break;
				}
				const languagesCodeField = translationsRelation.junction_field;
				if (!languagesCodeField) {
					break;
				}
				item = item.find((el) => el[languagesCodeField] === i18n.locale) || item[0];
			}
		}
	}
	return item;
}
