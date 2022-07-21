import config, { getUrl } from '@common/config';
import vendors from '@common/get-dbs-to-test';
import request from 'supertest';
import knex, { Knex } from 'knex';
import { spawn, ChildProcess } from 'child_process';
import { awaitDirectusConnection } from '@utils/await-connection';
import * as common from '@common/index';
import { sleep } from '@utils/sleep';

describe('Rate Limiting (memcache)', () => {
	const databases = new Map<string, Knex>();
	const rateLimitedDirectus = {} as { [vendor: string]: ChildProcess };
	const rateLimiterPoints = 5;
	const rateLimiterDuration = 3;

	beforeAll(async () => {
		const promises = [];

		for (const vendor of vendors) {
			const newServerPort = Number(config.envs[vendor]!.PORT) + 200;
			databases.set(vendor, knex(config.knexConfig[vendor]!));

			config.envs[vendor]!.RATE_LIMITER_ENABLED = 'true';
			config.envs[vendor]!.RATE_LIMITER_STORE = 'memcache';
			config.envs[vendor]!.RATE_LIMITER_POINTS = String(rateLimiterPoints);
			config.envs[vendor]!.RATE_LIMITER_DURATION = String(rateLimiterDuration);
			config.envs[vendor]!.PORT = String(newServerPort);
			config.envs[vendor]!.RATE_LIMITER_MEMCACHE = 'localhost:6108';

			const server = spawn('node', ['api/cli', 'start'], { env: config.envs[vendor] });
			rateLimitedDirectus[vendor] = server;

			let serverOutput = '';
			server.stdout.on('data', (data) => (serverOutput += data.toString()));
			server.on('exit', (code) => {
				if (code !== null) throw new Error(`Directus-${vendor} server failed: \n ${serverOutput}`);
			});
			promises.push(awaitDirectusConnection(newServerPort));
		}

		// Give the server some time to start
		await Promise.all(promises);
	}, 180000);

	afterAll(async () => {
		for (const [vendor, connection] of databases) {
			rateLimitedDirectus[vendor]!.kill();

			config.envs[vendor]!.PORT = String(Number(config.envs[vendor]!.PORT) - 200);
			config.envs[vendor]!.RATE_LIMITER_ENABLED = 'false';
			delete config.envs[vendor]!.RATE_LIMITER_STORE;
			delete config.envs[vendor]!.RATE_LIMITER_POINTS;
			delete config.envs[vendor]!.RATE_LIMITER_DURATION;
			delete config.envs[vendor]!.RATE_LIMITER_MEMCACHED;

			await connection.destroy();
		}
	});

	describe('rate limits user with authentication', () => {
		it.each(vendors)('%s', async (vendor) => {
			await sleep(rateLimiterDuration * 1000);

			for (let i = 0; i < rateLimiterPoints; i++) {
				await request(getUrl(vendor))
					.get(`/server/info`)
					.set('Authorization', `Bearer ${common.USER.APP_ACCESS.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);
			}

			// Reached user scoped rate limit
			await request(getUrl(vendor))
				.get(`/server/info`)
				.set('Authorization', `Bearer ${common.USER.APP_ACCESS.TOKEN}`)
				.expect('Content-Type', /application\/json/)
				.expect(429);
		});
	});

	describe('rate limits IP without authentication', () => {
		it.each(vendors)('%s', async (vendor) => {
			await sleep(rateLimiterDuration * 1000);

			for (let i = 0; i < rateLimiterPoints; i++) {
				await request(getUrl(vendor))
					.get(`/server/info`)
					.expect('Content-Type', /application\/json/)
					.expect(200);
			}

			for (let i = 0; i < rateLimiterPoints - 1; i++) {
				await request(getUrl(vendor))
					.get(`/server/info`)
					.expect('Content-Type', /application\/json/)
					.expect(429);
			}
		});
	});

	describe('rate limits IP with invalid authentication', () => {
		it.each(vendors)('%s', async (vendor) => {
			await sleep(rateLimiterDuration * 1000);

			for (let i = 0; i < rateLimiterPoints; i++) {
				await request(getUrl(vendor))
					.get(`/server/info`)
					.set('Authorization', 'Bearer FakeToken')
					.expect('Content-Type', /application\/json/)
					.expect(401);
			}

			await request(getUrl(vendor))
				.get(`/server/info`)
				.set('Authorization', 'Bearer FakeToken')
				.expect('Content-Type', /application\/json/)
				.expect(429);
		});
	});

	describe('clears rate limited IP with authenticated requests', () => {
		it.each(vendors)('%s', async (vendor) => {
			await sleep(rateLimiterDuration * 1000);

			// Invalid authentication to almost hit IP rate limit
			for (let i = 0; i < rateLimiterPoints - 1; i++) {
				await request(getUrl(vendor))
					.get(`/server/info`)
					.set('Authorization', 'Bearer FakeToken')
					.expect('Content-Type', /application\/json/)
					.expect(401);
			}

			// Authenticated clears the IP rate limit
			for (let i = 0; i < rateLimiterPoints; i++) {
				await request(getUrl(vendor))
					.get(`/server/info`)
					.set('Authorization', `Bearer ${common.USER.APP_ACCESS.TOKEN}`)
					.expect('Content-Type', /application\/json/)
					.expect(200);
			}

			// But will hit the user scoped rate limiting
			await request(getUrl(vendor))
				.get(`/server/info`)
				.set('Authorization', `Bearer ${common.USER.APP_ACCESS.TOKEN}`)
				.expect('Content-Type', /application\/json/)
				.expect(429);

			// IP rate limiting should be cleared
			for (let i = 0; i < rateLimiterPoints; i++) {
				await request(getUrl(vendor))
					.get(`/server/info`)
					.expect('Content-Type', /application\/json/)
					.expect(200);
			}

			// IP rate limited
			await request(getUrl(vendor))
				.get(`/server/info`)
				.expect('Content-Type', /application\/json/)
				.expect(429);
		});
	});
});
