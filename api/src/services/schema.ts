import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../database/index.js';
import { ForbiddenError } from '../errors/index.js';
import type {
	AbstractServiceOptions,
	Snapshot,
	SnapshotDiff,
	SnapshotDiffWithHash,
	SnapshotWithHash,
} from '../types/index.js';
import { applyDiff } from '../utils/apply-diff.js';
import { getSnapshotDiff } from '../utils/get-snapshot-diff.js';
import { getSnapshot } from '../utils/get-snapshot.js';
import { getVersionedHash } from '../utils/get-versioned-hash.js';
import { validateApplyDiff } from '../utils/validate-diff.js';
import { validateSnapshot } from '../utils/validate-snapshot.js';
import { CollectionsService } from './collections.js';
import { FieldsService } from './fields.js';
import { RelationsService } from './relations.js';
import { getSchema } from '../utils/get-schema.js';

export class SchemaService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options: Omit<AbstractServiceOptions, 'schema'>) {
		this.knex = options.knex ?? getDatabase();
		this.accountability = options.accountability ?? null;
	}

	async snapshot(): Promise<Snapshot> {
		if (this.accountability?.admin !== true) throw new ForbiddenError();

		const currentSnapshot = await getSnapshot({ database: this.knex });

		return currentSnapshot;
	}

	async apply(payload: SnapshotDiffWithHash): Promise<void> {
		if (this.accountability?.admin !== true) throw new ForbiddenError();

		const currentSnapshot = await this.snapshot();
		const snapshotWithHash = this.getHashedSnapshot(currentSnapshot);

		if (!validateApplyDiff(payload, snapshotWithHash)) return;

		await applyDiff(currentSnapshot, payload.diff, { database: this.knex });
	}

	async diff(
		snapshot: Snapshot,
		options?: { currentSnapshot?: Snapshot; force?: boolean }
	): Promise<SnapshotDiff | null> {
		if (this.accountability?.admin !== true) throw new ForbiddenError();

		validateSnapshot(snapshot, options?.force);

		const currentSnapshot = options?.currentSnapshot ?? (await getSnapshot({ database: this.knex }));
		const diff = getSnapshotDiff(currentSnapshot, snapshot);

		if (diff.collections.length === 0 && diff.fields.length === 0 && diff.relations.length === 0) {
			return null;
		}

		return diff;
	}

	getHashedSnapshot(snapshot: Snapshot): SnapshotWithHash {
		const snapshotHash = getVersionedHash(snapshot);

		return {
			...snapshot,
			hash: snapshotHash,
		};
	}

	async generateTypeDefinition() {
        const schema = await getSchema();
        const collections = await (new CollectionsService({ knex: this.knex, schema })).readByQuery();
        const fields = await (new FieldsService({ knex: this.knex, schema })).readAll();
        const relations = await (new RelationsService({ knex: this.knex, schema })).readAll();

        const typeMap: Record<string, { fields: Record<string, any>, name: string }> = {};

        // setup type map
        for (const field of fields) {
            if (field.meta?.system) continue;

            if (!typeMap[field.collection]) {
                typeMap[field.collection] = {
                    fields: {},
                    name: pascalCase(field.collection)
                };
            }

            typeMap[field.collection].fields[field.field] = {
                type: `'${field.type}'`,
                nullable: !!field.schema?.is_nullable,
                primary_key: !!field.schema?.is_primary_key,
            }
        }

        for (const relation of relations) {
            if (relation.meta?.system) continue;
            typeMap[relation.collection].fields[relation.field].relation = relation.meta;
        }

        const mainType = {};

        // build main type
        for (const collection of collections) {
            if (!typeMap[collection.collection]) continue;
            mainType[collection.collection] = typeMap[collection.collection].name + (collection.meta?.singleton ? '' : '[]');
        }

        let output = '';
        // render main type
        output += fmtInterface('MySchema', mainType);

        // render individual collections
        for (const typeDef of Object.values(typeMap)) {
            output += fmtInterface(typeDef.name, Object.fromEntries(Object.entries(typeDef.fields)
                .map(([key, value]) => ([key, value.type + (value.nullable ? ' | null' : '')]))));
        }

		return output;
	}
}


function fmtInterface(name, fields) {
    return `
export interface ${name} {
${Object.entries(fields).map(([key, value]) => {
    return `\t${key}: ${value};`
}).join('\n')}
}
`;
}

function pascalCase(str) {
    return str.split(/[-_]/g).map(
        part => part.replace(/\w+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    ).join('')
}
