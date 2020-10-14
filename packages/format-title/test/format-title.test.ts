import formatTitle from '../src/format-title';

const testStrings = [
	['the_new_iphone_comes_out_in_october', 'The New iPhone Comes out in October'],
	['i-like-watching-youtube', 'I like Watching YouTube'],
	['thumbnailerTTL', 'Thumbnailer TTL'],
	['youtubeApi', 'YouTube API'],
	['thumbnail-cache-ttl', 'Thumbnail Cache TTL'],
	[
		'This package is pretty useful though not often used',
		'This Package Is Pretty Useful though Not Often Used',
	],
	['auto_sign_out', 'Auto Sign Out'],
	['edited_on', 'Edited On'],
	['actionBy', 'Action By'],
	['app_url', 'App URL'],
	['2fa_secret', '2FA Secret'],
];

describe('Title Formatter', () => {
	testStrings.forEach(([input, output]) => {
		test(`${input} => ${output}`, () => {
			expect(formatTitle(input)).toBe(output);
		});
	});

	it('Accepts custom separator regex', () => {
		expect(formatTitle('hello+world', /\+/g)).toBe('Hello World');
	});
});
