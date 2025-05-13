import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';
import { transaction } from '../../utils/transaction.js';
import { FieldsService } from '../../services/fields.js';
import { getSchema } from '../../utils/get-schema.js';

const RETENTION_INDEXES = [
    { collection: 'directus_activity', field: 'timestamp' },
    { collection: 'directus_revisions', field: 'parent' },
];

// TODO: mysql should have an exception as it already has an index on `directus_revisions.parent`

export async function up(knex: Knex): Promise<void> {
    const helpers = getHelpers(knex);
    const schema = await getSchema();
    const service = new FieldsService({ knex, schema });

    for (const { collection, field } of RETENTION_INDEXES) {
        const existingColumn = await service.columnInfo(collection, field);

        if (!existingColumn.is_indexed) {
            await helpers.schema.createIndexConcurrent(collection, field);
        }
    }
}

export async function down(knex: Knex): Promise<void> {
    const helpers = getHelpers(knex);
    const schema = await getSchema();
    const service = new FieldsService({ knex, schema });
    
    for (const { collection, field } of RETENTION_INDEXES) {
        const existingColumn = await service.columnInfo(collection, field);

        if (existingColumn.is_indexed) {
            await transaction(knex, async (trx) => {
                await trx.schema.alterTable(collection, async (table) => {
                    table.dropIndex([field], helpers.schema.generateIndexName('index', collection, field));
                });
            });
        }
    }
}
