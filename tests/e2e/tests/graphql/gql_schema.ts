import { DirectusClient, GraphqlClient, RestClient, StaticTokenClient } from '@directus/sdk';
import { Snapshot } from '@directus/types';
import { expect, test } from 'vitest';
import { generateScopedUser } from '../../utils/userScoped';
import { Schema } from './schema';

export function schema(
	api: DirectusClient<Schema> & GraphqlClient<Schema> & RestClient<Schema> & StaticTokenClient<Schema>,
	snapshot: Snapshot,
) {
	test('graphql schema', async () => {
		const { token } = await generateScopedUser(api, snapshot);

		const schema = await fetch(`http://localhost:${process.env['PORT']}/server/specs/graphql/?access_token=${token}`);

		await expect(schema.text()).resolves.toMatchSnapshot();
	});
}
