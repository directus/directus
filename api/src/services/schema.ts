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

        const typeMap: Record<string, {
			fields: Record<string, {
				type: string;
				nullable: boolean;
				primary_key: boolean;
				relation?: any;
			}>,
			singleton: boolean,
			name: string,
		}> = {};

		const fieldTypes: Record<string, string> = {
			string: 'string',
			bigInteger: 'string',
			boolean: 'boolean',
			date: "'datetime'",
			dateTime: "'datetime'",
			decimal: 'number',
			float: 'number',
			integer: 'number',
			json: "'json'",
			text: 'string',
			time: "'datetime'",
			timestamp: "'datetime'",
			uuid: 'string',
			hash: 'string',
		}

		// map collections
		const collections: Record<string, { name: string; singleton: boolean; }> = {};
        const rawCollections = await (new CollectionsService({ knex: this.knex, schema })).readByQuery();

		for (const collection of rawCollections) {
			collections[collection.collection] = {
				name: collection.collection,
				singleton: !!collection.meta?.singleton
			};
		}

		// map fields
		const fields: Record<string, { type: string; nullable: boolean; primary_key: boolean }[]> = {};
        const rawFields = await (new FieldsService({ knex: this.knex, schema })).readAll();

		for (const field of rawFields) {
			// ignore built-in system fields and unknown types
            if (field.meta?.system || !typeMap[field.type]) continue;

			const fieldList = fields[field.collection] ?? [];
			const mappedType = fieldTypes[field.type] ?? 'any';

			fieldList.push({
				type: mappedType,
				nullable: !!field.schema?.is_nullable,
				primary_key: !!field.schema?.is_primary_key,
			})

			fields[field.collection] = fieldList;
		}

		// map relations
		const relations: Record<string, Record<string, any>> = {};
        const rawRelations = await (new RelationsService({ knex: this.knex, schema })).readAll();

        for (const relation of rawRelations) {
			// ignore built-in system relations
            if (relation.meta?.system) continue;

			const relationalFields = relations[relation.collection] ?? {};
			const { many_collection, many_field, one_collection, one_field, one_collection_field } = relation.meta ?? {};

			// o2m
			if (many_collection && many_field && one_collection && one_field) {
				relationalFields[one_field] = [many_collection, many_field]
			}

			// m2o
			if (many_collection && many_field && one_collection && !one_field) {
				relationalFields[many_field] = [one_collection]
			}

			// m2a
			if (many_field === 'item' && one_collection_field) {
				relationalFields[many_field] = [relation.meta?.one_allowed_collections]
			}

			relations[relation.collection] = relationalFields;

			// const collectionDefinition = typeMap[relation.collection];
			// const fieldDefinition = collectionDefinition?.fields[relation.field];
			// if (!fieldDefinition) continue;
			// fieldDefinition.relation = relation.meta;

            // typeMap[relation.collection].fields[relation.field] = fieldDefinition;
        }

        // const mainType = {};
        // build main type
        // for (const collection of collections) {
        //     if (!typeMap[collection.collection]) continue;
        //     mainType[collection.collection] = typeMap[collection.collection].name + (collection.meta?.singleton ? '' : '[]');
        // }

		return { collections, fields, relations };

        // let output = '';
        // // render main type
        // output += fmtInterface('MySchema', mainType);

        // // render individual collections
        // for (const typeDef of Object.values(typeMap)) {
        //     output += fmtInterface(typeDef.name, Object.fromEntries(Object.entries(typeDef.fields)
        //         .map(([key, value]) => ([key, value.type + (value.nullable ? ' | null' : '')]))));
        // }

		// return output;
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
