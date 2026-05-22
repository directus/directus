import { getUrl } from '@common/config';
import type { Vendor } from '@common/get-dbs-to-test';
import { USER } from '@common/variables';
import request from 'supertest';

/**
 * Mutates a single key on the running Directus's cached env object via the
 * `env-inject` test extension. Lets a test flip a runtime-checked env var
 * (e.g. DB_MSSQL_TRUST_BATCH_RETURNING) on the SAME spawned Directus
 * instance, without restarting it.
 *
 * Only effective for env vars that are re-read on each access via the `env`
 * reference returned by useEnv() — env vars captured into a const at module
 * load are unaffected.
 */
export async function setDirectusEnv(vendor: Vendor, key: string, value: string): Promise<void> {
	const response = await request(getUrl(vendor))
		.post('/env-inject/set')
		.send({ key, value })
		.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

	if (response.statusCode !== 200) {
		throw new Error(`env-inject set ${key} failed (${response.statusCode}): ${JSON.stringify(response.body)}`);
	}
}
