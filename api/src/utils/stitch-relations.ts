import type { Relation, RelationMeta } from "@directus/shared/types";
import type { ForeignKey } from 'knex-schema-inspector/dist/types/foreign-key';

/**
	 * Combine raw schema foreign key information with Directus relations meta rows to form final
	 * Relation objects
	 */
export function stitchRelations(metaRows: RelationMeta[], schemaRows: ForeignKey[]) {
    const results = schemaRows.map((foreignKey): Relation => {
        return {
            collection: foreignKey.table,
            field: foreignKey.column,
            related_collection: foreignKey.foreign_key_table,
            schema: foreignKey,
            meta:
                metaRows.find((meta) => {
                    if (meta.many_collection !== foreignKey.table) return false;
                    if (meta.many_field !== foreignKey.column) return false;
                    if (meta.one_collection && meta.one_collection !== foreignKey.foreign_key_table) return false;
                    return true;
                }) || null,
        };
    });

    /**
     * Meta rows that don't have a corresponding schema foreign key
     */
    const remainingMetaRows = metaRows
        .filter((meta) => {
            return !results.find((relation) => relation.meta === meta);
        })
        .map((meta): Relation => {
            return {
                collection: meta.many_collection,
                field: meta.many_field,
                related_collection: meta.one_collection ?? null,
                schema: null,
                meta: meta,
            };
        });

    results.push(...remainingMetaRows);

    return results;
}