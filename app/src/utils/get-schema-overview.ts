import { CollectionOverview, FieldOverview, SchemaOverview } from '@directus/types';
import { useCollectionsStore } from '@/stores/collections';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';

export function getSchemaOverview(): SchemaOverview {
	const relationsStore = useRelationsStore();
	const fieldsStore = useFieldsStore();
	const collectionsStore = useCollectionsStore();

	return {
		collections: Object.fromEntries(
			collectionsStore.collections.map((collection) => {
				const fields = fieldsStore.getFieldsForCollection(collection.collection).map((field) => [
					field.field,
					{
						field: field.field,
						defaultValue: field.schema?.default_value,
						nullable: field.schema?.is_nullable ?? false,
						generated: false, // unimplemented
						type: field.type,
						dbType: field.schema?.data_type ?? null,
						alias: false, // unimplemented
						searchable: field.meta?.searchable ?? true,
						note: field.meta?.note ?? null,
						precision: field.schema?.numeric_precision ?? null,
						scale: field.schema?.numeric_scale ?? null,
						special: field.meta?.special ?? [],
						validation: field.meta?.validation ?? null,
					} satisfies FieldOverview,
				]);

				const collectionInfo: CollectionOverview = {
					collection: collection.collection,
					fields: Object.fromEntries(fields),
					accountability: collection.meta?.accountability ?? null,
					note: collection.meta?.note ?? null,
					primary: fieldsStore.getPrimaryKeyFieldForCollection(collection.collection)!.field,
					singleton: collection.meta?.singleton ?? false,
					sortField: collection.meta?.sort_field ?? null,
				};

				return [collection.collection, collectionInfo];
			}),
		),
		relations: relationsStore.relations,
	};
}
