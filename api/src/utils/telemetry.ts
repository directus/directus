import { machineId } from 'node-machine-id';
import { version } from '../../package.json';
import env from '../env';
import logger from '../logger';

export async function collectTelemetry(): Promise<void> {
	const axios = (await import('axios')).default;

	if (env['TELEMETRY'] !== false) {
		try {
			await axios.post('https://telemetry.directus.io/', {
				version: version,
				public_url: env['PUBLIC_URL'],
				project_id: env['KEY'],
				machine_id: await machineId(),
				db_client: env['DB_CLIENT'],
			});
		} catch (err: any) {
			if (env['NODE_ENV'] === 'development') {
				logger.error(err);
			}
		}
	}
}
