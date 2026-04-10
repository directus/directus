import { ChildProcess, spawn } from 'child_process';
import config, { type Env, getUrl, paths } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';
import { USER } from '@common/variables';
import { awaitDirectusConnection } from '@utils/await-connection';
import getPort from 'get-port';
import { cloneDeep } from 'lodash-es';
import { SMTPServer } from 'smtp-server';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('/server', () => {
	describe('GET /health', () => {
		let fakeSMTPServer: SMTPServer;

		beforeAll(async () => {
			fakeSMTPServer = new SMTPServer({
				authOptional: true,
				hideSTARTTLS: true,
				onData(_stream, _, cb) {
					cb();
				},
			});

			await new Promise<void>((resolve) =>
				fakeSMTPServer.listen(1025, '127.0.0.1', () => {
					resolve();
				}),
			);
		}, 180_000);

		afterAll(async () => {
			await new Promise<void>((resolve) =>
				fakeSMTPServer.close(() => {
					resolve();
				}),
			);
		});

		describe.each(vendors)('%s', (vendor) => {
			it('forbidden for public', async () => {
				// Action
				const response = await request(getUrl(vendor)).get('/server/health');

				const gqlResponse = await requestGraphQL(getUrl(vendor), true, null, {
					query: {
						server_health: true,
					},
				});

				// Assert
				expect(response.statusCode).toBe(403);
				expect(gqlResponse.statusCode).toBe(200);
				expect(gqlResponse.body.errors).toBeDefined();
				expect(gqlResponse.body.errors[0].extensions.code).toBe('FORBIDDEN');
			});

			(['ADMIN', 'APP_ACCESS'] as (keyof typeof USER)[]).forEach((userKey) => {
				it(`differring format for ${USER[userKey].NAME}`, async () => {
					// Action
					const response = await request(getUrl(vendor))
						.get('/server/health')
						.set('Authorization', `Bearer ${USER[userKey].TOKEN}`);

					const gqlResponse = await requestGraphQL(getUrl(vendor), true, USER[userKey].TOKEN, {
						query: {
							server_health: true,
						},
					});

					// Assert
					expect(response.statusCode).toBe(200);
					expect(gqlResponse.statusCode).toBe(200);

					if (userKey === USER.ADMIN.KEY) {
						const adminResult = {
							status: expect.stringMatching(/ok|warn/),
							releaseId: expect.any(String),
							serviceId: expect.any(String),
							checks: expect.anything(),
						};

						expect(response.body).toEqual(adminResult);
						expect(gqlResponse.body.data.server_health).toEqual(adminResult);
					} else {
						const nonAdminResult = { status: expect.stringMatching(/ok|warn/) };

						expect(response.body).toEqual(nonAdminResult);
						expect(gqlResponse.body.data.server_health).toEqual(nonAdminResult);
					}
				});
			});
		});

		describe('HEALTHCHECK_ENABLED=false', () => {
			describe.each(vendors)('%s', (vendor) => {
				let directusInstance: ChildProcess;
				let env: Env;

				beforeAll(async () => {
					env = cloneDeep(config.envs);
					env[vendor]['HEALTHCHECK_ENABLED'] = 'false';
					env[vendor]['HEALTHCHECK_NAMESPACE'] = `directus:healthcheck:disabled:${vendor}`;

					const newPort = await getPort();
					env[vendor].PORT = String(newPort);

					directusInstance = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });

					await awaitDirectusConnection(newPort);
				}, 180_000);

				afterAll(async () => {
					directusInstance!.kill();
				});

				it('returns 404', async () => {
					// Action
					const response = await request(getUrl(vendor, env))
						.get('/server/health')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(404);
				});
			});
		});

		describe('HEALTHCHECK_SERVICES=database', () => {
			describe.each(vendors)('%s', (vendor) => {
				let directusInstance: ChildProcess;
				let env: Env;

				beforeAll(async () => {
					env = cloneDeep(config.envs);
					env[vendor]['HEALTHCHECK_SERVICES'] = 'database';
					env[vendor]['HEALTHCHECK_NAMESPACE'] = `directus:healthcheck:db-only:${vendor}`;

					const newPort = await getPort();
					env[vendor].PORT = String(newPort);

					directusInstance = spawn('node', [paths.cli, 'start'], { cwd: paths.cwd, env: env[vendor] });

					await awaitDirectusConnection(newPort);
				}, 180_000);

				afterAll(async () => {
					directusInstance!.kill();
				});

				it('only contains db checks', async () => {
					// Action
					const response = await request(getUrl(vendor, env))
						.get('/server/health')
						.set('Authorization', `Bearer ${USER.ADMIN.TOKEN}`);

					// Assert
					expect(response.statusCode).toBe(200);

					const checkKeys = Object.keys(response.body.checks);

					expect(checkKeys.length).toBeGreaterThan(0);

					const dbClient = env[vendor]['DB_CLIENT'];

					for (const key of checkKeys) {
						expect(key).toMatch(new RegExp(`^${dbClient}:`));
					}
				});
			});
		});
	});
});
