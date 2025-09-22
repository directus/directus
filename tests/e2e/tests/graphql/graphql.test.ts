import { createDirectus, graphql, rest, staticToken } from '@directus/sdk';
import { join } from 'path';
import { useSnapshot } from '@utils/useSnapshot.js';
import { crud } from './crud.js';
import { schema } from './gql_schema.js';
import type { Schema } from './schema.js';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`)
	.with(graphql())
	.with(rest())
	.with(staticToken('admin'));

const { collections, snapshot } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

crud(api, collections);
schema(api, snapshot);
