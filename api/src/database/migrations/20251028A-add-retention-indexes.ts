import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';
import { transaction } from '../../utils/transaction.js';
import { FieldsService } from '../../services/fields.js';
import { getSchema } from '../../utils/get-schema.js';
import { getDatabaseClient } from '../index.js';

const RETENTION_INDEXES = [
    { collection: 'directus_activity', field: 'timestamp', ignore: [] },
    { collection: 'directus_revisions', field: 'parent', ignore: ['mysql'] },
];

export async function up(knex: Knex): Promise<void> {
    const client = getDatabaseClient(knex);
    const helpers = getHelpers(knex);
    const schema = await getSchema();
    const service = new FieldsService({ knex, schema });

    for (const { collection, field, ignore } of RETENTION_INDEXES) {
        if (ignore.includes(client)) continue;

        const existingColumn = await service.columnInfo(collection, field);

        if (!existingColumn.is_indexed) {
            await helpers.schema.createIndex(collection, field, { attemptConcurrentIndex: true });
        }
    }
}

export async function down(knex: Knex): Promise<void> {
    const client = getDatabaseClient(knex);
    const helpers = getHelpers(knex);
    const schema = await getSchema();
    const service = new FieldsService({ knex, schema });
    
    for (const { collection, field, ignore } of RETENTION_INDEXES) {
        if (ignore.includes(client)) continue;

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
