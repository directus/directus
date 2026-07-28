import { expect, test } from 'vitest';
import { getDirectusUrlWithUtm, UTM_CAMPAIGN } from '@/utils/directus-url';

test('builds URL with all UTM parameters', () => {
	const result = getDirectusUrlWithUtm('https://directus.com/pricing', '11.0.0', 'test_content');

	expect(result).toBe(
		`https://directus.com/pricing?utm_source=self_hosted&utm_medium=product&utm_campaign=${UTM_CAMPAIGN}&utm_term=11.0.0&utm_content=test_content`,
	);
});

test('preserves base URL path exactly', () => {
	const result = getDirectusUrlWithUtm('https://directus.com/docs/licensing/overview', '10.5.0', 'some_link');

	expect(result.startsWith('https://directus.com/docs/licensing/overview?')).toBe(true);
});

test('includes dynamic utm_content', () => {
	const content = 'onboarding_get_license_link';
	const result = getDirectusUrlWithUtm('https://directus.com/oig', '11.0.0', content);

	expect(result).toContain(`utm_content=${content}`);
});
