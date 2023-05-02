import type { Accountability, SchemaOverview } from '@directus/types';
import { toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { merge } from 'lodash-es';
import { Readable } from 'node:stream';
import os from 'os';
import { performance } from 'perf_hooks';
import { getCache } from '../cache.js';
import getDatabase, { hasDatabaseConnection } from '../database/index.js';
import env from '../env.js';
import logger from '../logger.js';
import getMailer from '../mailer.js';
import { rateLimiterGlobal } from '../middleware/rate-limiter-global.js';
import { rateLimiter } from '../middleware/rate-limiter-ip.js';
import { SERVER_ONLINE } from '../server.js';
import { getStorage } from '../storage/index.js';
import type { AbstractServiceOptions } from '../types/index.js';
import { getOSInfo } from '../utils/get-os-info.js';
import { version } from '../utils/package.js';
import { SettingsService } from './settings.js';

export class ServerService {
	knex: Knex;
	accountability: Accountability | null;
	settingsService: SettingsService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.settingsService = new SettingsService({ knex: this.knex, schema: this.schema });
	}

	async serverInfo(): Promise<Record<string, any>> {
		const info: Record<string, any> = {};

		const projectInfo = await this.settingsService.readSingleton({
			fields: [
				'project_name',
				'project_descriptor',
				'project_logo',
				'project_color',
				'default_language',
				'public_foreground',
				'public_background',
				'public_note',
				'custom_css',
			],
		});

		info['project'] = projectInfo;

		if (this.accountability?.user) {
			if (env['RATE_LIMITER_ENABLED']) {
				info['rateLimit'] = {
					points: env['RATE_LIMITER_POINTS'],
					duration: env['RATE_LIMITER_DURATION'],
				};
			} else {
				info['rateLimit'] = false;
			}

			if (env['RATE_LIMITER_GLOBAL_ENABLED']) {
				info['rateLimitGlobal'] = {
					points: env['RATE_LIMITER_GLOBAL_POINTS'],
					duration: env['RATE_LIMITER_GLOBAL_DURATION'],
				};
			} else {
				info['rateLimitGlobal'] = false;
			}

			info['flows'] = {
				execAllowedModules: env['FLOWS_EXEC_ALLOWED_MODULES'] ? toArray(env['FLOWS_EXEC_ALLOWED_MODULES']) : [],
			};

			info['queryLimit'] = {
				default: env['QUERY_LIMIT_DEFAULT'],
				max: Number.isFinite(env['QUERY_LIMIT_MAX']) ? env['QUERY_LIMIT_MAX'] : -1,
			};
		}

		if (this.accountability?.admin === true) {
			const { osType, osVersion } = getOSInfo();

			info['directus'] = {
				version,
			};

			info['node'] = {
				version: process.versions.node,
				uptime: Math.round(process.uptime()),
			};

			info['os'] = {
				type: osType,
				version: osVersion,
				uptime: Math.round(os.uptime()),
				totalmem: os.totalmem(),
			};
		}

		return info;
	}

	async health(): Promise<Record<string, any>> {
		const { nanoid } = await import('nanoid');

		const checkID = nanoid(5);

		// Based on https://tools.ietf.org/id/draft-inadarei-api-health-check-05.html#name-componenttype
		type HealthData = {
			status: 'ok' | 'warn' | 'error';
			releaseId: string;
			serviceId: string;
			checks: {
				[service: string]: HealthCheck[];
			};
		};

		type HealthCheck = {
			componentType: 'system' | 'datastore' | 'objectstore' | 'email' | 'cache' | 'ratelimiter';
			observedValue?: number | string | boolean;
			observedUnit?: string;
			status: 'ok' | 'warn' | 'error';
			output?: any;
			threshold?: number;
		};

		const data: HealthData = {
			status: 'ok',
			releaseId: version,
			serviceId: env['KEY'],
			checks: merge(
				...(await Promise.all([
					testDatabase(),
					testCache(),
					testRateLimiter(),
					testRateLimiterGlobal(),
					testStorage(),
					testEmail(),
				]))
			),
		};

		if (SERVER_ONLINE === false) {
			data.status = 'error';
		}

		for (const [service, healthData] of Object.entries(data.checks)) {
			for (const healthCheck of healthData) {
				if (healthCheck.status === 'warn' && data.status === 'ok') {
					logger.warn(
						`${service} in WARN state, the observed value ${healthCheck.observedValue} is above the threshold of ${healthCheck.threshold}${healthCheck.observedUnit}`
					);

					data.status = 'warn';
					continue;
				}

				if (healthCheck.status === 'error' && (data.status === 'ok' || data.status === 'warn')) {
					logger.error(healthCheck.output, '%s in ERROR state', service);
					data.status = 'error';
					break;
				}
			}

			// No need to continue checking if parent status is already error
			if (data.status === 'error') break;
		}

		if (this.accountability?.admin !== true) {
			return { status: data.status };
		} else {
			return data;
		}

		async function testDatabase(): Promise<Record<string, HealthCheck[]>> {
			const database = getDatabase();
			const client = env['DB_CLIENT'];

			const checks: Record<string, HealthCheck[]> = {};

			// Response time
			// ----------------------------------------------------------------------------------------
			checks[`${client}:responseTime`] = [
				{
					status: 'ok',
					componentType: 'datastore',
					observedUnit: 'ms',
					observedValue: 0,
					threshold: env['DB_HEALTHCHECK_THRESHOLD'] ? +env['DB_HEALTHCHECK_THRESHOLD'] : 150,
				},
			];

			const startTime = performance.now();

			if (await hasDatabaseConnection()) {
				checks[`${client}:responseTime`]![0]!.status = 'ok';
			} else {
				checks[`${client}:responseTime`]![0]!.status = 'error';
				checks[`${client}:responseTime`]![0]!.output = `Can't connect to the database.`;
			}

			const endTime = performance.now();
			checks[`${client}:responseTime`]![0]!.observedValue = +(endTime - startTime).toFixed(3);

			if (
				Number(checks[`${client}:responseTime`]![0]!.observedValue!) >
					checks[`${client}:responseTime`]![0]!.threshold! &&
				checks[`${client}:responseTime`]![0]!.status !== 'error'
			) {
				checks[`${client}:responseTime`]![0]!.status = 'warn';
			}

			checks[`${client}:connectionsAvailable`] = [
				{
					status: 'ok',
					componentType: 'datastore',
					observedValue: database.client.pool.numFree(),
				},
			];

			checks[`${client}:connectionsUsed`] = [
				{
					status: 'ok',
					componentType: 'datastore',
					observedValue: database.client.pool.numUsed(),
				},
			];

			return checks;
		}

		async function testCache(): Promise<Record<string, HealthCheck[]>> {
			if (env['CACHE_ENABLED'] !== true) {
				return {};
			}

			const { cache } = getCache();

			const checks: Record<string, HealthCheck[]> = {
				'cache:responseTime': [
					{
						status: 'ok',
						componentType: 'cache',
						observedValue: 0,
						observedUnit: 'ms',
						threshold: env['CACHE_HEALTHCHECK_THRESHOLD'] ? +env['CACHE_HEALTHCHECK_THRESHOLD'] : 150,
					},
				],
			};

			const startTime = performance.now();

			try {
				await cache!.set(`health-${checkID}`, true, 5);
				await cache!.delete(`health-${checkID}`);
			} catch (err: any) {
				checks['cache:responseTime']![0]!.status = 'error';
				checks['cache:responseTime']![0]!.output = err;
			} finally {
				const endTime = performance.now();
				checks['cache:responseTime']![0]!.observedValue = +(endTime - startTime).toFixed(3);

				if (
					checks['cache:responseTime']![0]!.observedValue > checks['cache:responseTime']![0]!.threshold! &&
					checks['cache:responseTime']![0]!.status !== 'error'
				) {
					checks['cache:responseTime']![0]!.status = 'warn';
				}
			}

			return checks;
		}

		async function testRateLimiter(): Promise<Record<string, HealthCheck[]>> {
			if (env['RATE_LIMITER_ENABLED'] !== true) {
				return {};
			}

			const checks: Record<string, HealthCheck[]> = {
				'rateLimiter:responseTime': [
					{
						status: 'ok',
						componentType: 'ratelimiter',
						observedValue: 0,
						observedUnit: 'ms',
						threshold: env['RATE_LIMITER_HEALTHCHECK_THRESHOLD'] ? +env['RATE_LIMITER_HEALTHCHECK_THRESHOLD'] : 150,
					},
				],
			};

			const startTime = performance.now();

			try {
				await rateLimiter.consume(`health-${checkID}`, 1);
				await rateLimiter.delete(`health-${checkID}`);
			} catch (err: any) {
				checks['rateLimiter:responseTime']![0]!.status = 'error';
				checks['rateLimiter:responseTime']![0]!.output = err;
			} finally {
				const endTime = performance.now();
				checks['rateLimiter:responseTime']![0]!.observedValue = +(endTime - startTime).toFixed(3);

				if (
					checks['rateLimiter:responseTime']![0]!.observedValue > checks['rateLimiter:responseTime']![0]!.threshold! &&
					checks['rateLimiter:responseTime']![0]!.status !== 'error'
				) {
					checks['rateLimiter:responseTime']![0]!.status = 'warn';
				}
			}

			return checks;
		}

		async function testRateLimiterGlobal(): Promise<Record<string, HealthCheck[]>> {
			if (env['RATE_LIMITER_GLOBAL_ENABLED'] !== true) {
				return {};
			}

			const checks: Record<string, HealthCheck[]> = {
				'rateLimiterGlobal:responseTime': [
					{
						status: 'ok',
						componentType: 'ratelimiter',
						observedValue: 0,
						observedUnit: 'ms',
						threshold: env['RATE_LIMITER_GLOBAL_HEALTHCHECK_THRESHOLD']
							? +env['RATE_LIMITER_GLOBAL_HEALTHCHECK_THRESHOLD']
							: 150,
					},
				],
			};

			const startTime = performance.now();

			try {
				await rateLimiterGlobal.consume(`health-${checkID}`, 1);
				await rateLimiterGlobal.delete(`health-${checkID}`);
			} catch (err: any) {
				checks['rateLimiterGlobal:responseTime']![0]!.status = 'error';
				checks['rateLimiterGlobal:responseTime']![0]!.output = err;
			} finally {
				const endTime = performance.now();
				checks['rateLimiterGlobal:responseTime']![0]!.observedValue = +(endTime - startTime).toFixed(3);

				if (
					checks['rateLimiterGlobal:responseTime']![0]!.observedValue >
						checks['rateLimiterGlobal:responseTime']![0]!.threshold! &&
					checks['rateLimiterGlobal:responseTime']![0]!.status !== 'error'
				) {
					checks['rateLimiterGlobal:responseTime']![0]!.status = 'warn';
				}
			}

			return checks;
		}

		async function testStorage(): Promise<Record<string, HealthCheck[]>> {
			const storage = await getStorage();

			const checks: Record<string, HealthCheck[]> = {};

			for (const location of toArray(env['STORAGE_LOCATIONS'])) {
				const disk = storage.location(location);
				const envThresholdKey = `STORAGE_${location}_HEALTHCHECK_THRESHOLD`.toUpperCase();

				checks[`storage:${location}:responseTime`] = [
					{
						status: 'ok',
						componentType: 'objectstore',
						observedValue: 0,
						observedUnit: 'ms',
						threshold: env[envThresholdKey] ? +env[envThresholdKey] : 750,
					},
				];

				const startTime = performance.now();

				try {
					await disk.write(`health-${checkID}`, Readable.from(['check']));
					const fileStream = await disk.read(`health-${checkID}`);

					fileStream.on('data', async () => {
						fileStream.destroy();
						await disk.delete(`health-${checkID}`);
					});
				} catch (err: any) {
					checks[`storage:${location}:responseTime`]![0]!.status = 'error';
					checks[`storage:${location}:responseTime`]![0]!.output = err;
				} finally {
					const endTime = performance.now();
					checks[`storage:${location}:responseTime`]![0]!.observedValue = +(endTime - startTime).toFixed(3);

					if (
						Number(checks[`storage:${location}:responseTime`]![0]!.observedValue!) >
							checks[`storage:${location}:responseTime`]![0]!.threshold! &&
						checks[`storage:${location}:responseTime`]![0]!.status !== 'error'
					) {
						checks[`storage:${location}:responseTime`]![0]!.status = 'warn';
					}
				}
			}

			return checks;
		}

		async function testEmail(): Promise<Record<string, HealthCheck[]>> {
			const checks: Record<string, HealthCheck[]> = {
				'email:connection': [
					{
						status: 'ok',
						componentType: 'email',
					},
				],
			};

			const mailer = getMailer();

			try {
				await mailer.verify();
			} catch (err: any) {
				checks['email:connection']![0]!.status = 'error';
				checks['email:connection']![0]!.output = err;
			}

			return checks;
		}
	}
}
