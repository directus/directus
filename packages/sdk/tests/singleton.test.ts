/**
 * @jest-environment node
 */

import { Directus } from '../src';
import { test } from './utils';

type Settings = {
	url: string;
	copyright: string;
	title: string;
	ua_code: string;
	show_menu: boolean;
};

type MyWebsite = {
	settings: Settings;
};

describe('singleton', function () {
	test(`can get an item`, async (url, nock) => {
		nock()
			.get('/items/settings')
			.reply(200, {
				data: {
					url: 'http://website.com',
					copyright: 'MyWebsite',
					title: 'Website Title',
					ua_code: 'UA1234567890',
					show_menu: true,
				},
			});

		const sdk = new Directus<MyWebsite>(url);
		const settings = await sdk.singleton('settings').read();

		expect(settings).not.toBeNull();
		expect(settings).not.toBeUndefined();
		expect(settings?.url).toBe('http://website.com');
		expect(settings?.title).toBe(`Website Title`);
		expect(settings?.show_menu).toBe(true);
	});

	test(`can update an item`, async (url, nock) => {
		nock()
			.patch('/items/settings', {
				title: 'New Website Title',
			})
			.reply(200, {
				data: {
					url: 'http://website.com',
					copyright: 'MyWebsite',
					title: 'New Website Title',
					ua_code: 'UA1234567890',
					show_menu: true,
				},
			});

		const sdk = new Directus<MyWebsite>(url);
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
