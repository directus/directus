import { Ref } from '@vue/composition-api';
import { Relation } from '@/stores/relations/types';
import { Field } from '@/stores/fields/types';

type IsNewContext = {
	relationCurrentToJunction: Ref<Relation | undefined>;
	junctionCollectionPrimaryKeyField: Ref<Field>;
	relatedCollectionPrimaryKeyField: Ref<Field>;
};

export default function isNew(
	item: any,
	{ relationCurrentToJunction, junctionCollectionPrimaryKeyField, relatedCollectionPrimaryKeyField }: IsNewContext
) {
	if (!relationCurrentToJunction.value) return;
	if (!relationCurrentToJunction.value.junction_field) return;

	const junctionPrimaryKey = junctionCollectionPrimaryKeyField.value.field;
	const junctionField = relationCurrentToJunction.value.junction_field;
	const relatedPrimaryKey = relatedCollectionPrimaryKeyField.value.field;
	const hasPrimaryKey = !!item[junctionPrimaryKey];
	const hasRelatedPrimaryKey = !!item[junctionField]?.[relatedPrimaryKey];

	return hasPrimaryKey === false && hasRelatedPrimaryKey === false;
}
