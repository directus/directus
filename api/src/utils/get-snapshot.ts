import getDatabase from '../database';
import { getSchema } from './get-schema';
import { CollectionsService, FieldsService, RelationsService } from '../services';
import { version } from '../../package.json';
import { Snapshot, SnapshotField, SnapshotRelation } from '../types';
import { Knex } from 'knex';
import { omit } from 'lodash';
import { SchemaOverview } from '@directus/shared/types';

export async function getSnapshot(options?: { database?: Knex; schema?: SchemaOverview }): Promise<Snapshot> {
	const database = options?.database ?? getDatabase();
	const schema = options?.schema ?? (await getSchema({ database }));

	const collectionsService = new CollectionsService({ knex: database, schema });
	const fieldsService = new FieldsService({ knex: database, schema });
	const relationsService = new RelationsService({ knex: database, schema });

	const [collections, fields, relations] = await Promise.all([
		collectionsService.readByQuery(),
		fieldsService.readAll(),
		relationsService.readAll(),
	]);

	return {
		version: 1,
		directus: version,
		collections: collections.filter((item: any) => excludeSystem(item)),
		fields: fields.filter((item: any) => excludeSystem(item)).map(omitID) as SnapshotField[],
		relations: relations.filter((item: any) => excludeSystem(item)).map(omitID) as SnapshotRelation[],
	};
}

function excludeSystem(item: { meta?: { system?: boolean } }) {
	if (item?.meta?.system === true) return false;
	return true;
}

function omitID(item: Record<string, any>) {
	return omit(item, 'meta.id');
}
