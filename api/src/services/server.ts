import { AbstractServiceOptions, Accountability, SchemaOverview } from '../types';
import { Knex } from 'knex';
import database from '../database';
import os from 'os';
import logger from '../logger';
// @ts-ignore
import { version } from '../../package.json';
import macosRelease from 'macos-release';
import { SettingsService } from './settings';
import mailer from './mailer';
import env from '../env';
import { performance } from 'perf_hooks';
import cache from '../cache';
import { rateLimiter } from '../middleware/rate-limiter';
import storage from '../storage';
import { nanoid } from 'nanoid';
import { toArray } from '../utils/to-array';
import { merge } from 'lodash';

export class ServerService {
	knex: Knex;
	accountability: Accountability | null;
	settingsService: SettingsService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || database;
		this.accountability = options.accountability || null;
		this.schema = options.schema;
		this.settingsService = new SettingsService({ knex: this.knex, schema: this.schema });
	}

	async serverInfo() {
		const info: Record<string, any> = {};

		const projectInfo = await this.settingsService.readSingleton({
			fields: [
				'project_name',
				'project_logo',
				'project_color',
				'public_foreground',
				'public_background',
				'public_note',
				'custom_css',
			],
		});

		info.project = projectInfo;

		if (this.accountability?.admin === true) {
			const osType = os.type() === 'Darwin' ? 'macOS' : os.type();

			const osVersion = osType === 'macOS' ? `${macosRelease().name} (${macosRelease().version})` : os.release();

			info.directus = {
				version,
			};
			info.node = {
				version: process.versions.node,
				uptime: Math.round(process.uptime()),
			};
			info.os = {
				type: osType,
				version: osVersion,
				uptime: Math.round(os.uptime()),
				totalmem: os.totalmem(),
			};
		}

		return info;
	}

	async health() {
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
			serviceId: env.KEY,
			checks: merge(
				...(await Promise.all([testDatabase(), testCache(), testRateLimiter(), testStorage(), testEmail()]))
			),
		};

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
			const client = env.DB_CLIENT;

			const checks: Record<string, HealthCheck[]> = {};

			// Response time
			// ----------------------------------------------------------------------------------------
			checks[`${client}:responseTime`] = [
				{
					status: 'ok',
					componentType: 'datastore',
					observedUnit: 'ms',
					observedValue: 0,
					threshold: 150,
				},
			];

			const startTime = performance.now();

			try {
				await database.raw('SELECT 1');
				checks[`${client}:responseTime`][0].status = 'ok';
			} catch (err) {
				checks[`${client}:responseTime`][0].status = 'error';
				checks[`${client}:responseTime`][0].output = err;
			} finally {
				const endTime = performance.now();
				checks[`${client}:responseTime`][0].observedValue = +(endTime - startTime).toFixed(3);

				if (
					checks[`${client}:responseTime`][0].observedValue! > checks[`${client}:responseTime`][0].threshold! &&
					checks[`${client}:responseTime`][0].status !== 'error'
				) {
					checks[`${client}:responseTime`][0].status = 'warn';
				}
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
			if (env.CACHE_ENABLED !== true) {
				return {};
			}

			const checks: Record<string, HealthCheck[]> = {
				'cache:responseTime': [
					{
						status: 'ok',
						componentType: 'cache',
						observedValue: 0,
						observedUnit: 'ms',
						threshold: 150,
					},
				],
			};

			const startTime = performance.now();

			try {
				await cache!.set(`health-${checkID}`, true, 5);
				await cache!.delete(`health-${checkID}`);
			} catch (err) {
				checks['cache:responseTime'][0].status = 'error';
				checks['cache:responseTime'][0].output = err;
			} finally {
				const endTime = performance.now();
				checks['cache:responseTime'][0].observedValue = +(endTime - startTime).toFixed(3);

				if (
					checks['cache:responseTime'][0].observedValue > checks['cache:responseTime'][0].threshold! &&
					checks['cache:responseTime'][0].status !== 'error'
				) {
					checks['cache:responseTime'][0].status = 'warn';
				}
			}

			return checks;
		}

		async function testRateLimiter(): Promise<Record<string, HealthCheck[]>> {
			if (env.RATE_LIMITER_ENABLED !== true) {
				return {};
			}

			const checks: Record<string, HealthCheck[]> = {
				'rateLimiter:responseTime': [
					{
						status: 'ok',
						componentType: 'ratelimiter',
						observedValue: 0,
						observedUnit: 'ms',
						threshold: 150,
					},
				],
			};

			const startTime = performance.now();

			try {
				await rateLimiter.consume(`health-${checkID}`, 1);
				await rateLimiter.delete(`health-${checkID}`);
			} catch (err) {
				checks['rateLimiter:responseTime'][0].status = 'error';
				checks['rateLimiter:responseTime'][0].output = err;
			} finally {
				const endTime = performance.now();
				checks['rateLimiter:responseTime'][0].observedValue = +(endTime - startTime).toFixed(3);

				if (
					checks['rateLimiter:responseTime'][0].observedValue > checks['rateLimiter:responseTime'][0].threshold! &&
					checks['rateLimiter:responseTime'][0].status !== 'error'
				) {
					checks['rateLimiter:responseTime'][0].status = 'warn';
				}
			}

			return checks;
		}

		async function testStorage(): Promise<Record<string, HealthCheck[]>> {
			const checks: Record<string, HealthCheck[]> = {};

			for (const location of toArray(env.STORAGE_LOCATIONS)) {
				const disk = storage.disk(location);

				checks[`storage:${location}:responseTime`] = [
					{
						status: 'ok',
						componentType: 'objectstore',
						observedValue: 0,
						observedUnit: 'ms',
						threshold: 750,
					},
				];

				const startTime = performance.now();

				try {
					await disk.put(`health-${checkID}`, 'check');
					await disk.get(`health-${checkID}`);
					await disk.delete(`health-${checkID}`);
				} catch (err) {
					checks[`storage:${location}:responseTime`][0].status = 'error';
					checks[`storage:${location}:responseTime`][0].output = err;
				} finally {
					const endTime = performance.now();
					checks[`storage:${location}:responseTime`][0].observedValue = +(endTime - startTime).toFixed(3);

					if (
						checks[`storage:${location}:responseTime`][0].observedValue! >
							checks[`storage:${location}:responseTime`][0].threshold! &&
						checks[`storage:${location}:responseTime`][0].status !== 'error'
					) {
						checks[`storage:${location}:responseTime`][0].status = 'warn';
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

			try {
				await mailer?.verify();
			} catch (err) {
				checks['email:connection'][0].status = 'error';
				checks['email:connection'][0].output = err;
			}

			return checks;
		}
	}
}
