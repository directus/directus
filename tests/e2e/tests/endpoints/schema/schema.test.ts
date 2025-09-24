import { sandbox } from '@directus/sandbox';
import { createDirectus, rest, staticToken } from '@directus/sdk';
import { database } from '@utils/constants.js';
import getPort from 'get-port';
import { test } from 'vitest';

const directus = await sandbox(database, {
	port: await getPort(),
	killPorts: true,
	inspect: false,
	silent: true,
	docker: {
		basePort: getPort,
	},
});

const api = createDirectus(`http://localhost:${directus.env['PORT']}`).with(rest()).with(staticToken('admin'));

test('', async () => {});
