import { DirectusClient, GraphqlClient, RestClient, StaticTokenClient } from '@directus/sdk';
import { Snapshot } from '@directus/types';
import { expect, test } from 'vitest';
import { generateScopedUser } from '../../utils/userScoped';
import { Schema } from './schema';

const database = process.env['DATABASE'] as string;

export function schema(
	api: DirectusClient<Schema> & GraphqlClient<Schema> & RestClient<Schema> & StaticTokenClient<Schema>,
	snapshot: Snapshot,
) {
	// TODO: Oracle has a **STUPID** hard limit of VARCHAR(4000) on directus_revisions.data, so this currently fails to generate the scoped user
	if (database !== 'oracle')
		test('graphql schema', async () => {
			const { token } = await generateScopedUser(api, snapshot);

			const schema = await fetch(`http://localhost:${process.env['PORT']}/server/specs/graphql/?access_token=${token}`);

			await expect(schema.text()).resolves.toBeDefined();
			// TODO: Figure out how to compare schema properly, as it changes with different DBs
			// await expect(schema.text()).resolves.toMatchSnapshot();
		});
}
