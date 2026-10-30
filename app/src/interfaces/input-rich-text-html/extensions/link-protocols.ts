import { isAllowedUri, Link, type LinkOptions } from '@tiptap/extension-link';
import type { AnyExtension } from '@tiptap/vue-3';
import { CustomImage } from './image';

const SCHEME = /^[a-z][a-z0-9+.-]*$/;
const BLOCKED_SCHEMES = new Set(['javascript', 'vbscript', 'data']);

// Link's default HTMLAttributes force target/rel on every link, rewriting same-tab links on round-trip
const LINK_OPTIONS: Partial<LinkOptions> = {
	defaultProtocol: 'https',
	openOnClick: false,
	HTMLAttributes: { target: null, rel: null },
};

export const BaseLink = Link.configure(LINK_OPTIONS);

/** Extra URL schemes for text and image links, on top of Tiptap's defaults (http, https, mailto, ...). */
export function buildLinkProtocols(raw: unknown): { extensions: AnyExtension[]; protocols: string[]; key: string } {
	const protocols = parseProtocols(raw);
	if (protocols.length === 0) return { extensions: [], protocols: [], key: '' };

	// not passed as `protocols`, which would register them with linkify for autolink
	const link = Link.configure({ ...LINK_OPTIONS, isAllowedUri: (url) => isLinkAllowed(url, protocols) });

	return {
		extensions: [link, CustomImage.configure({ linkProtocols: protocols })],
		protocols,
		key: protocols.join(','),
	};
}

export function isLinkAllowed(url: string, protocols: string[]): boolean {
	return Boolean(isAllowedUri(url, protocols));
}

/** The `csv` option is stored as an array, but a value set through the API may be a comma-separated string. */
function parseProtocols(raw: unknown): string[] {
	const entries: unknown[] = typeof raw === 'string' ? raw.split(',') : [];
	if (Array.isArray(raw)) entries.push(...raw);

	const protocols: string[] = [];

	for (const entry of entries) {
		if (typeof entry !== 'string') continue;

		const scheme = entry.trim().toLowerCase().replace(/:\/*$/, '');
		if (scheme === '') continue;

		if (SCHEME.test(scheme) && !BLOCKED_SCHEMES.has(scheme)) protocols.push(scheme);
		// eslint-disable-next-line no-console
		else console.warn('[wysiwyg] Ignored a linkProtocols entry that is not an allowed URL scheme:', entry);
	}

	return [...new Set(protocols)].sort();
}
