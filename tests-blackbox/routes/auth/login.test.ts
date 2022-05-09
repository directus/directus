import { getUrl } from '@common/config';
import * as common from '@common/index';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';

describe('/auth', () => {
	describe('POST /login', () => {
		describe('when correct credentials are provided', () => {
			describe('returns an access_token, expires and a refresh_token', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							// Action
							const response = await request(getUrl(vendor))
								.post(`/auth/login`)
								.send({ email: common.USER[userKey].EMAIL, password: common.USER[userKey].PASSWORD })
								.expect('Content-Type', /application\/json/);

							// Assert
							expect(response.statusCode).toBe(200);
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
			});
		});
		describe('when incorrect credentials are provided', () => {
			describe('returns code: UNAUTHORIZED for incorrect password', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							const response = await request(getUrl(vendor))
								.post(`/auth/login`)
								.send({
									email: common.USER[userKey].EMAIL,
									password: common.USER[userKey].PASSWORD + 'typo',
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
				});
			});
			describe('returns code: UNAUTHORIZED for unregistered email', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							const response = await request(getUrl(vendor))
								.post(`/auth/login`)
								.send({
									email: 'test@fake.com',
									password: common.USER[userKey].PASSWORD,
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
				});
			});
			describe('returns code: INVALID_CREDENTIALS for invalid email', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							const response = await request(getUrl(vendor))
								.post(`/auth/login`)
								.send({
									email: 'invalidEmail',
									password: common.USER[userKey].PASSWORD,
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
				});
			});
			describe('returns message: "password is required" when no password is provided', () => {
				common.TEST_USERS.forEach((userKey) => {
					describe(common.USER[userKey].NAME, () => {
						it.each(vendors)('%s', async (vendor) => {
							const response = await request(getUrl(vendor))
								.post(`/auth/login`)
								.send({
									email: common.USER[userKey].EMAIL,
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
	});
});
