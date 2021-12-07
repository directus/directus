import knex, { Knex } from 'knex';
import config from '../../config';
import request from 'supertest';
import { getDBsToTest } from '../../get-dbs-to-test';

// The first describe is the service name (auth, items, collections, etc)
describe('auth', () => {
	// second describe is the endpoint name (login, logout, refresh)
	describe('login', () => {
		const databases = new Map<string, Knex>();

		/* 
		Use beforeAll() to populate the databases variable. 
		This variable will be used in the test for things 
		like seeding the databases through knex
		*/
		beforeAll(async () => {
			const vendors = getDBsToTest();

			for (const vendor of vendors) {
				databases.set(vendor, knex(config.knexConfig[vendor]!));
			}
		});

		/* Use afterAll() to destroy the connection instances. */
		afterAll(async () => {
			for (const [_vendor, connection] of databases) {
				await connection.destroy();
			}
		});

		/* Then describe the scenario */
		describe('when correct credentials are provided', () => {
			/* 
			Use "it" to describe the result
			Use it.each(getDBsToTest()) to test on every enabled database. getDBsToTest() must be imported
			"vendor" is the DB returned from getDBsToTest(). It is used to replace %p in the test description
			Start the test description with %p so that which db failed is obvious, this it more important when running tests locally.
			*/
			it.each(getDBsToTest())(`%p returns an access_token, expires and a refresh_token for admin`, async (vendor) => {
				/* 
				In this test I am using the already seeded admin account. 
				Testing on multiple roles and permissions is important though..
				*/

				/* the url variable will need to be included in most and is the address of the docker for each database */
				const url = `http://localhost:${config.ports[vendor]!}`;

				/* Use request() imported from 'supertest' not 'HTTP' */
				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'test@admin.com',
						password: 'TestAdminPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				/* 
				Because the actual tokens returned will vary use "expect.any()"
				In most cases checking every param is not necessary, as seen in the bad result tests below.
				Use .toMatchObject() in those cases.
				*/
				expect(response.body).toBe({
					data: {
						access_token: expect.any(String),
						expires: expect.any(Number),
						refresh_token: expect.any(String),
					},
				});
			});
			it.each(getDBsToTest())(`%p returns an access_token, expires and a refresh_token for user`, async (vendor) => {
				/* 
				In this test I am using the already seeded User account. 
				Testing on multiple roles and permissions is important.
				*/
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'test@user.com',
						password: 'TestUserPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				/* 
				Because the actual tokens returned will vary use "expect.any()"
				In most cases checking every param is not necessary, as seen in the incorrect credentials tests below.
				Use .toMatchObject() in those cases.
				*/
				expect(response.body).toBe({
					data: {
						access_token: expect.any(String),
						expires: expect.any(Number),
						refresh_token: expect.any(String),
					},
				});
			});
		});
		describe('when incorrect credentials are provided', () => {
			it.each(getDBsToTest())(`%p returns code: INVALID_CREDENTIALS for incorrect password`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'test@admin.com',
						password: 'IncorrectPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				/* 
				In most cases checking every param is not necessary, as seen in below.
				Use .toMatchObject() in those cases.
				*/
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
			it.each(getDBsToTest())(`%p returns code: INVALID_CREDENTIALS for unregistered email`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'test@fake.com',
						password: 'TestAdminPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				/* 
				In most cases checking every param is not necessary, as seen in below.
				Use .toMatchObject() in those cases.
				*/
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
			it.each(getDBsToTest())(`%p returns code: INVALID_CREDENTIALS for invalid email`, async (vendor) => {
				const url = `http://localhost:${config.ports[vendor]!}`;

				const response = await request(url)
					.post(`/auth/login`)
					.send({
						email: 'invalidEmail',
						password: 'TestAdminPassword',
					})
					.expect('Content-Type', /application\/json/)
					.expect(200);

				/* 
				In most cases checking every param is not necessary, as seen in below.
				Use .toMatchObject() in those cases.
				*/
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
			it.each(getDBsToTest())(
				`%p returns message: "password is required" when no password is provided`,
				async (vendor) => {
					const url = `http://localhost:${config.ports[vendor]!}`;

					const response = await request(url)
						.post(`/auth/login`)
						.send({
							email: 'invalidEmail',
							password: 'TestAdminPassword',
						})
						.expect('Content-Type', /application\/json/)
						.expect(200);

					/* 
				In most cases checking every param is not necessary, as seen in below.
				Use .toMatchObject() in those cases.
				*/
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
				}
			);
		});
	});
});
