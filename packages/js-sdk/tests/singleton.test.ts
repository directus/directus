import { Directus } from '../src';
import { mockServer, URL } from './utils';
import { describe, expect, it } from 'vitest';
import { rest } from 'msw';

type Settings = {
	URL: string;
	copyright: string;
	title: string;
	ua_code: string;
	show_menu: boolean;
};

type MyWebsite = {
	settings: Settings;
};

describe('singleton', function () {
	it(`can get an item`, async () => {
		mockServer.use(
			rest.get(URL + '/items/settings', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							url: 'http://website.com',
							copyright: 'MyWebsite',
							title: 'Website Title',
							ua_code: 'UA1234567890',
							show_menu: true,
						},
					})
				)
			)
		);

		const sdk = new Directus<MyWebsite>(URL);
		const settings = await sdk.singleton('settings').read();

		expect(settings).not.toBeNull();
		expect(settings).not.toBeUndefined();
		expect(settings?.url).toBe('http://website.com');
		expect(settings?.title).toBe(`Website Title`);
		expect(settings?.show_menu).toBe(true);
	});

	it(`can update an item`, async () => {
		mockServer.use(
			rest.patch(URL + '/items/settings', (_req, res, ctx) =>
				res(
					ctx.status(200),
					ctx.json({
						data: {
							url: 'http://website.com',
							copyright: 'MyWebsite',
							title: 'New Website Title',
							ua_code: 'UA1234567890',
							show_menu: true,
						},
					})
				)
			)
		);

		const sdk = new Directus<MyWebsite>(URL);

		const settings = await sdk.singleton('settings').update({
			title: 'New Website Title',
		});

		expect(settings).not.toBeNull();
		expect(settings).not.toBeUndefined();
		expect(settings?.url).toBe('http://website.com');
		expect(settings?.title).toBe(`New Website Title`);
		expect(settings?.show_menu).toBe(true);
	});
});
