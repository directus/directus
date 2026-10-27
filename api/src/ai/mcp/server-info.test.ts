import { describe, expect, test } from 'vitest';
import { getServerInfo } from './server-info.js';

describe('getServerInfo', () => {
	test('uses Directus defaults when the project has no branding', () => {
		const info = getServerInfo();

		expect(info).toEqual({
			name: 'directus',
			title: 'Directus',
			version: expect.any(String),
			websiteUrl: 'https://directus.com',
			description: expect.any(String),
		});
	});

	test('brands the server with the project settings', () => {
		const info = getServerInfo({
			name: 'Acme CMS',
			descriptor: 'Marketing content',
			url: 'https://acme.example.com',
			icon: Buffer.from('png'),
		});

		expect(info).toMatchObject({
			name: 'directus',
			title: 'Acme CMS',
			description: 'Marketing content',
			websiteUrl: 'https://acme.example.com',
			icons: [{ src: 'data:image/png;base64,cG5n', mimeType: 'image/png', sizes: ['64x64'] }],
		});
	});

	test.each(['example.org/docs', 'javascript:alert(1)', 'https://'])(
		'falls back to directus.com for website %j',
		(url) => {
			expect(getServerInfo({ url }).websiteUrl).toBe('https://directus.com');
		},
	);
});
