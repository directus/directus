import { normalizeUrl } from './normalize-url';
import { sameOrigin } from './same-origin';
import { parseUrl } from '@/utils/parse-url';
import { renderPlainStringTemplate } from '@/utils/render-string-template';

export type VersionPlacement =
	| { type: 'query'; paramName: string }
	| { type: 'path'; segmentIndex: number }
	| { type: 'subdomain'; labelIndex: number }
	| { type: 'hash'; segmentIndex: number }
	| null;

const SENTINEL = 'directus---version';

export function analyzeTemplate(template: string): VersionPlacement {
	const rendered = renderPlainStringTemplate(template, { $version: SENTINEL });
	if (!rendered) return null;

	const url = parseUrl(rendered);
	if (!url) return null;

	for (const [key, value] of url.searchParams) {
		if (value === SENTINEL) return { type: 'query', paramName: key };
	}

	const pathSegments = url.pathname.split('/');

	for (let i = 0; i < pathSegments.length; i++) {
		if (pathSegments[i] === SENTINEL) return { type: 'path', segmentIndex: i };
	}

	const labels = url.hostname.split('.');

	for (let i = 0; i < labels.length; i++) {
		if (labels[i] === SENTINEL) return { type: 'subdomain', labelIndex: i };
	}

	const hashSegments = url.hash.replace(/^#\/?/, '').split('/');

	for (let i = 0; i < hashSegments.length; i++) {
		if (hashSegments[i] === SENTINEL) return { type: 'hash', segmentIndex: i };
	}

	return null;
}

export function extractVersion(url: string, placement: VersionPlacement) {
	if (!placement) return null;

	const parsed = parseUrl(url);
	if (!parsed) return null;

	if (placement.type === 'query') return parsed.searchParams.get(placement.paramName);
	if (placement.type === 'path') return parsed.pathname.split('/')[placement.segmentIndex] ?? null;
	if (placement.type === 'subdomain') return parsed.hostname.split('.')[placement.labelIndex] ?? null;
	if (placement.type === 'hash') return parsed.hash.replace(/^#\/?/, '').split('/')[placement.segmentIndex] ?? null;

	return null;
}

export function replaceVersion(url: string, placement: VersionPlacement, newVersion: string) {
	if (!placement) return url;

	const parsed = parseUrl(url);
	if (!parsed) return url;

	if (placement.type === 'query') {
		parsed.searchParams.set(placement.paramName, newVersion);
		return normalizeUrl(parsed.href);
	}

	if (placement.type === 'path') {
		const segments = parsed.pathname.split('/');
		segments[placement.segmentIndex] = newVersion;
		parsed.pathname = segments.join('/');
		return normalizeUrl(parsed.href);
	}

	if (placement.type === 'subdomain') {
		const labels = parsed.hostname.split('.');
		labels[placement.labelIndex] = newVersion;
		parsed.hostname = labels.join('.');
		return normalizeUrl(parsed.href);
	}

	if (placement.type === 'hash') {
		const prefix = parsed.hash.startsWith('#/') ? '#/' : '#';
		const hashContent = parsed.hash.replace(/^#\/?/, '');
		const segments = hashContent.split('/');
		segments[placement.segmentIndex] = newVersion;
		parsed.hash = prefix + segments.join('/');
		return normalizeUrl(parsed.href);
	}

	return url;
}

export function matchesTemplate(templateUrl: string, concreteUrl: string, placement: VersionPlacement) {
	if (!placement) return sameOrigin(templateUrl, concreteUrl);

	const resolved = renderPlainStringTemplate(templateUrl, { $version: SENTINEL });
	if (!resolved) return false;

	if (placement.type === 'subdomain') return stripVersionLabel(resolved) === stripVersionLabel(concreteUrl);

	return sameOrigin(resolved, concreteUrl);

	function stripVersionLabel(url: string) {
		if (placement?.type !== 'subdomain') return url;

		const labels = parseUrl(url)?.hostname.split('.');
		labels?.splice(placement.labelIndex, 1);
		return labels?.join('.');
	}
}
