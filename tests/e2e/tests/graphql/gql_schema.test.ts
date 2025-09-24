import { generateScopedUser } from '@utils/userScoped.js';
import { expect, test } from 'vitest';
import type { Schema } from './schema.d.ts';

import { createDirectus, graphql, rest, staticToken } from '@directus/sdk';
import { database, port } from '@utils/constants.js';
import { useSnapshot } from '@utils/useSnapshot.js';

const api = createDirectus<Schema>(`http://localhost:${port}`).with(graphql()).with(rest()).with(staticToken('admin'));

const { snapshot } = await useSnapshot<Schema>(api);

// TODO: Oracle has a **STUPID** hard limit of VARCHAR(4000) on directus_revisions.data, so this currently fails to generate the scoped user
if (database !== 'oracle')
	test('graphql schema', async () => {
		const { token } = await generateScopedUser(api, snapshot);

		const schema = await fetch(`http://localhost:${port}/server/specs/graphql/?access_token=${token}`);

		await expect(schema.text()).resolves.toBeDefined();
		// TODO: Figure out how to compare schema properly, as it changes with different DBs
		// await expect(schema.text()).resolves.toMatchSnapshot();
	});
