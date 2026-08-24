export const UTM_CAMPAIGN = '2026_05_licensing';

const UTM_SOURCE = 'self_hosted';
const UTM_MEDIUM = 'product';

export function getDirectusUrlWithUtm(baseUrl: string, version: string | undefined, content: string): string {
	return `${baseUrl}?utm_source=${UTM_SOURCE}&utm_medium=${UTM_MEDIUM}&utm_campaign=${UTM_CAMPAIGN}&utm_term=${version}&utm_content=${content}`;
}
