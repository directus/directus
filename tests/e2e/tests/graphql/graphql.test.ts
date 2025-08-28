import { createDirectus, graphql, rest, staticToken } from '@directus/sdk';
import { join } from 'path';
import { useSnapshot } from '../../utils/useSnapshot';
import { crud } from './crud';
import { schema } from './gql_schema';
import { Schema } from './schema';

const api = createDirectus<Schema>(`http://localhost:${process.env['PORT']}`)
	.with(graphql())
	.with(rest())
	.with(staticToken('admin'));

const { collections, snapshot } = await useSnapshot<Schema>(api, join(import.meta.dirname, 'snapshot.json'));

crud(api, collections);
schema(api, snapshot);
