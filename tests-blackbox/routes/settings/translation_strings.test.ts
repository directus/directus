import { getUrl } from '@common/config';
import * as common from '@common/index';
import request from 'supertest';
import vendors from '@common/get-dbs-to-test';
import { requestGraphQL } from '@common/transport';

const languages = ['en-US', 'zh-CN', 'es-ES', 'invalid language'];
const translations = [
	{
		key: 'one',
		lang: 'en-US',
		value: 'one',
	},
	{
		key: 'one',
		lang: 'zh-CN',
		value: '一',
	},
	{
		key: 'one',
		lang: 'es-ES',
		value: 'uno',
	},
	{
		key: 'two',
		lang: 'en-US',
		value: 'two',
	},
	{
		key: 'two',
		lang: 'zh-CN',
		value: '二',
	},
	{
		key: 'two',
		lang: 'es-ES',
		value: 'dos',
	},
];

async function updateTranslationStrings(vendor: string, token: string, translations: any) {
	await request(getUrl(vendor))
		.patch('/settings')
		.send({
			translation_strings: JSON.stringify(translations),
		})
		.set('Authorization', `Bearer ${token}`);
}

describe('/settings', () => {
	const existingTranslations: Record<string, any> = {};

	beforeAll(async () => {
		for (const vendor of vendors) {
			existingTranslations[vendor] = (
				await request(getUrl(vendor))
					.get('/settings')
					.query({
						fields: 'translation_strings',
					})
					.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`)
			).body.data.translation_strings;
		}
	});

	afterAll(async () => {
		for (const vendor of vendors) {
			await request(getUrl(vendor))
				.patch('/settings')
				.send({
					translation_strings: existingTranslations[vendor],
				})
				.set('Authorization', `Bearer ${common.USER.ADMIN.TOKEN}`);
		}
	});

	common.TEST_USERS.forEach((userKey) => {
		describe('GET /', () => {
			describe('fetches all translation strings', () => {
				describe(common.USER[userKey].NAME, () => {
					beforeAll(async () => {
						for (const vendor of vendors) {
							await updateTranslationStrings(vendor, common.USER.ADMIN.TOKEN, translations);
						}
					});

					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const translationStringsField = 'translation_strings';

						// Action
						const response = await request(getUrl(vendor))
							.get('/settings')
							.query({
								fields: translationStringsField,
							})
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), true, common.USER[userKey].TOKEN, {
							query: {
								settings: {
									[translationStringsField]: true,
								},
							},
						});

						// Assert
						if (userKey === common.USER.ADMIN.KEY || userKey === common.USER.APP_ACCESS.KEY) {
							expect(response.statusCode).toBe(200);
							expect(gqlResponse.statusCode).toBe(200);

							expect(response.body.data[translationStringsField]).toEqual(translations);
							expect(gqlResponse.body.data.settings[translationStringsField]).toEqual(translations);
						} else {
							expect(response.statusCode).toBe(403);
							expect(gqlResponse.statusCode).toBe(400);

							expect(response.body.errors).toBeDefined();
							expect(gqlResponse.body.errors).toBeDefined();
						}
					});
				});
			});

			describe('fetches translation strings of a single language', () => {
				describe.each(languages)('for %s', (language: string) => {
					describe(common.USER[userKey].NAME, () => {
						beforeAll(async () => {
							for (const vendor of vendors) {
								await updateTranslationStrings(vendor, common.USER.ADMIN.TOKEN, translations);
							}
						});

						it.each(vendors)('%s', async (vendor) => {
							// Setup
							const translationsAliasField = 'translations';

							// Action
							const response = await request(getUrl(vendor))
								.get('/settings')
								.query({
									fields: translationsAliasField,
									alias: {
										[translationsAliasField]: 'json(translation_strings$[*])',
									},
									deep: JSON.stringify({
										[translationsAliasField]: {
											_filter: {
												'$.lang': {
													_eq: language,
												},
											},
										},
									}),
								})
								.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

							// Assert
							if (userKey === common.USER.ADMIN.KEY || userKey === common.USER.APP_ACCESS.KEY) {
								expect(response.statusCode).toBe(200);
								expect(response.body.data[translationsAliasField]).toEqual(
									translations.filter((translation: any) => {
										return translation.lang === language;
									})
								);
							} else {
								expect(response.statusCode).toBe(403);
								expect(response.body.errors).toBeDefined();
							}
						});
					});
				});
			});
		});

		describe('PATCH /', () => {
			describe('updates translation strings', () => {
				describe(common.USER[userKey].NAME, () => {
					beforeEach(async () => {
						for (const vendor of vendors) {
							await updateTranslationStrings(vendor, common.USER.ADMIN.TOKEN, []);
						}
					});

					it.each(vendors)('%s', async (vendor) => {
						// Setup
						const translationStringsField = 'translation_strings';

						// Action
						await updateTranslationStrings(vendor, common.USER[userKey].TOKEN, translations);
						const response = await request(getUrl(vendor))
							.get('/settings')
							.query({
								fields: translationStringsField,
							})
							.set('Authorization', `Bearer ${common.USER[userKey].TOKEN}`);

						const gqlResponse = await requestGraphQL(getUrl(vendor), true, common.USER[userKey].TOKEN, {
							query: {
								settings: {
									[translationStringsField]: true,
								},
							},
						});

						// Assert
						if (userKey === common.USER.ADMIN.KEY) {
							expect(response.statusCode).toBe(200);
							expect(gqlResponse.statusCode).toBe(200);

							expect(response.body.data[translationStringsField]).toEqual(translations);
							expect(gqlResponse.body.data.settings[translationStringsField]).toEqual(translations);
						} else if (userKey === common.USER.APP_ACCESS.KEY) {
							expect(response.statusCode).toBe(200);
							expect(gqlResponse.statusCode).toBe(200);

							expect(response.body.data[translationStringsField]).toEqual([]);
							expect(gqlResponse.body.data.settings[translationStringsField]).toEqual([]);
						} else {
							expect(response.statusCode).toBe(403);
							expect(gqlResponse.statusCode).toBe(400);

							expect(response.body.errors).toBeDefined();
							expect(gqlResponse.body.errors).toBeDefined();
						}
					});
				});
			});
		});
	});
});
