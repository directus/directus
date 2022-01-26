import knex, { Knex } from 'knex';
import config, { getUrl } from '../../config';
import request from 'supertest';
import vendors from '../../get-dbs-to-test';

describe('auth', () => {
	describe('login', () => {
		const databases = new Map<string, Knex>();

		beforeAll(async () => {
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
			describe('returns an access_token, expires and a refresh_token for admin', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
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
			});
			describe('returns an access_token, expires and a refresh_token for user', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
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
			});
			describe('returns an access_token, expires and a refresh_token for noRoleUser', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
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
				});
			});
		});
		describe('when incorrect credentials are provided', () => {
			describe('returns code: UNAUTHORIZED for incorrect password', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.post(`/auth/login`)
						.send({
							email: 'test@admin.com',
							password: 'IncorrectPassword',
						})
						.expect('Content-Type', /application\/json/)
						.expect(401);
					expect(response.body).toMatchObject({
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
			});
			describe('returns code: UNAUTHORIZED for unregistered email', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.post(`/auth/login`)
						.send({
							email: 'test@fake.com',
							password: 'TestAdminPassword',
						})
						.expect('Content-Type', /application\/json/)
						.expect(401);

					expect(response.body).toMatchObject({
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
			});
			describe('returns code: INVALID_CREDENTIALS for invalid email', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.post(`/auth/login`)
						.send({
							email: 'invalidEmail',
							password: 'TestAdminPassword',
						})
						.expect('Content-Type', /application\/json/)
						.expect(400);

					expect(response.body).toMatchObject({
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
			});
			describe('returns message: "password is required" when no password is provided', () => {
				it.each(vendors)('%s', async (vendor) => {
					const response = await request(getUrl(vendor))
						.post(`/auth/login`)
						.send({
							email: 'test@admin.com',
						})
						.expect('Content-Type', /application\/json/)
						.expect(400);

					expect(response.body).toMatchObject({
						errors: [
							{
								message: '"password" is required',
								extensions: {
									code: 'INVALID_PAYLOAD',
								},
							},
						],
					});
				});
			});
		});
	});
});
