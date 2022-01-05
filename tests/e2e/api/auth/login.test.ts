import knex, { Knex } from 'knex';
import config from '../../config';
import request from 'supertest';
import { getDBsToTest } from '../../get-dbs-to-test';

describe('auth', () => {
	describe('login', () => {
		const databases = new Map<string, Knex>();

		beforeAll(async () => {
			const vendors = getDBsToTest();

			for (const vendor of vendors) {
				databases.set(vendor, knex(config.knexConfig[vendor]!));
			}
		});

		afterAll(async () => {
			for (const [_vendor, connection] of databases) {
				await connection.destroy();
			}
		});

		describe('when correct credentials are provided', () => {
			it.each(getDBsToTest())(`%p returns an access_token, expires and a refresh_token for admin`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({ email: 'test@admin.com', password: 'TestAdminPassword' })
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body).toMatchObject({
					data: {
						access_token: expect.any(String),
						expires: expect.any(Number),
						refresh_token: expect.any(String),
					},
				});
			});
			it.each(getDBsToTest())(`%p returns an access_token, expires and a refresh_token for user`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'test@user.com',
						password: 'TestUserPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				expect(response.body).toMatchObject({
					data: {
						access_token: expect.any(String),
						expires: expect.any(Number),
						refresh_token: expect.any(String),
					},
				});
			});
			it.each(getDBsToTest())(
				`%p returns an access_token, expires and a refresh_token for noRoleUser`,
				async (vendor) => {
					const url = `http://localhost:${config.ports[vendor]!}`;

					const response = await request(url)
						.post(`/auth/login`)
						.send({
							email: 'test@noroleuser.com',
							password: 'TestNoRoleUserPassword',
						})
						.expect('Content-Type', /application\/json/)
						.expect(200);

					expect(response.body).toMatchObject({
						data: {
							access_token: expect.any(String),
							expires: expect.any(Number),
							refresh_token: expect.any(String),
						},
					});
				}
			);
		});
		describe('when incorrect credentials are provided', () => {
			it.each(getDBsToTest())(`%p returns code: UNAUTHORIZED for incorrect password`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'test@admin.com',
						password: 'IncorrectPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(401);
				expect(response.body).toStrictEqual({
					errors: [
						{
							message: 'Invalid user credentials.',
							extensions: {
								code: 'INVALID_CREDENTIALS',
							},
						},
					],
				});
			});
			it.each(getDBsToTest())(`%p returns code: UNAUTHORIZED for unregistered email`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'test@fake.com',
						password: 'TestAdminPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(401);

				expect(response.body).toStrictEqual({
					errors: [
						{
							message: 'Invalid user credentials.',
							extensions: {
								code: 'INVALID_CREDENTIALS',
							},
						},
					],
				});
			});
			it.each(getDBsToTest())(`%p returns code: INVALID_CREDENTIALS for invalid email`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'invalidEmail',
						password: 'TestAdminPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(400);

				expect(response.body).toStrictEqual({
					errors: [
						{
							message: '"email" must be a valid email',
							extensions: {
								code: 'INVALID_PAYLOAD',
							},
						},
					],
				});
			});
			it.each(getDBsToTest())(
				`%p returns message: "password is required" when no password is provided`,
				async (vendor) => {
					const url = `http://localhost:${config.ports[vendor]!}`;

					const response = await request(url)
						.post(`/auth/login`)
						.send({
							email: 'test@admin.com',
						})
						.expect('Content-Type', /application\/json/)
						.expect(400);

					expect(response.body).toStrictEqual({
						errors: [
							{
								message: '"password" is required',
								extensions: {
									code: 'INVALID_PAYLOAD',
								},
							},
						],
					});
				}
			);
		});
	});
});
