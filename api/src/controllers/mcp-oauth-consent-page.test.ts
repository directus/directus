import { describe, expect, test } from 'vitest';
import { renderConsentPage, renderErrorPage } from './mcp-oauth-consent-page.js';

const baseOpts = {
	projectName: 'Test Project',
	projectColor: '#6644ff',
	logoUrl: null,
	appearance: 'auto',
};

const baseData = {
	clientName: 'Test Client',
	redirectUri: 'https://example.com/callback',
	scope: 'mcp:access',
	signedParams: 'test-jwt',
	decisionUrl: 'https://example.com/decision',
};

describe('consent page escaping', () => {
	test('clientName with script tag is HTML-escaped', async () => {
		const html = await renderConsentPage({ ...baseData, clientName: '<script>alert("xss")</script>' }, baseOpts);
		expect(html).not.toContain('<script>alert');
		expect(html).toContain('&lt;script&gt;');
	});

	test('redirectUri with HTML tags is escaped', async () => {
		const html = await renderConsentPage({ ...baseData, redirectUri: '<img src=x onerror=alert(1)>' }, baseOpts);
		expect(html).not.toContain('<img src=x');
		expect(html).toContain('&lt;img');
	});

	test('themeAttr renders correctly as raw', async () => {
		const html = await renderConsentPage(baseData, { ...baseOpts, appearance: 'dark' });
		expect(html).toContain('data-theme="dark"');
	});

	test('custom logoUrl renders via structural img with escaped alt', async () => {
		const html = await renderConsentPage(baseData, {
			...baseOpts,
			projectName: 'Name "with" quotes',
			logoUrl: 'https://example.com/logo.png',
		});

		expect(html).toContain('<img');
		expect(html).toContain('src="https://example.com/logo.png"');
		// alt attribute should have quotes escaped (Liquid uses &#34; for double quotes)
		expect(html).not.toContain('alt="Name "with"');
		expect(html).toContain('&#34;');
	});

	test('projectColor with CSS injection falls back to default', async () => {
		const html = await renderConsentPage(baseData, {
			...baseOpts,
			projectColor: 'red; background: url(evil)',
		});

		expect(html).toContain('--project-color: #6644ff');
	});
});

describe('error page escaping', () => {
	test('description with HTML is escaped', async () => {
		const html = await renderErrorPage('<img src=x onerror=alert(1)>', baseOpts);
		expect(html).not.toContain('<img src=x');
		expect(html).toContain('&lt;img');
	});
});
