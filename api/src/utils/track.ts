import mid from 'node-machine-id';
import os from 'os';
import { toArray } from '@directus/utils';
import { version } from './package.js';
import env from '../env.js';
import logger from '../logger.js';
import { getMilliseconds } from './get-milliseconds.js';

export async function track(event: string): Promise<void> {
	const axios = (await import('axios')).default;

	if (env['TELEMETRY'] !== false) {
		const info = await getEnvInfo(event);

		try {
			await axios.post('https://telemetry.directus.io/', info);
		} catch (err: any) {
			if (env['NODE_ENV'] === 'development') {
				logger.error(err);
			}
		}
	}
}

async function getEnvInfo(event: string) {
	return {
		version: version,
		event: event,
		project_id: env['KEY'],
		machine_id: await mid.machineId(),
		environment: env['NODE_ENV'],
		stack: 'node',
		os: {
			arch: os.arch(),
			platform: os.platform(),
			release: os.release(),
		},
		rate_limiter: {
			enabled: env['RATE_LIMITER_ENABLED'],
			points: +env['RATE_LIMITER_POINTS'],
			duration: +env['RATE_LIMITER_DURATION'],
			store: env['RATE_LIMITER_STORE'],
		},
		cache: {
			enabled: env['CACHE_ENABLED'],
			ttl: getMilliseconds(env['CACHE_TTL']),
			store: env['CACHE_STORE'],
		},
		storage: {
			drivers: getStorageDrivers(),
		},
		cors: {
			enabled: env['CORS_ENABLED'],
		},
		email: {
			transport: env['EMAIL_TRANSPORT'],
		},
		auth: {
			providers: toArray(env['AUTH_PROVIDERS'])
				.map((v: string) => v.trim())
				.filter((v: string) => v),
		},
		db_client: env['DB_CLIENT'],
	};
}

function getStorageDrivers() {
	const drivers: string[] = [];
	const locations = toArray(env['STORAGE_LOCATIONS'])
		.map((v: string) => v.trim())
		.filter((v: string) => v);

	for (const location of locations) {
		const driver = env[`STORAGE_${location.toUpperCase()}_DRIVER`];
		drivers.push(driver);
	}

	return drivers;
}
