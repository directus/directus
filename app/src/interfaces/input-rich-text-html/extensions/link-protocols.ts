import { isAllowedUri, Link, type LinkOptions } from '@tiptap/extension-link';
import type { AnyExtension } from '@tiptap/vue-3';
import { registerCustomProtocol, reset } from 'linkifyjs';
import { CustomImage } from './image';

const SCHEME = /^[a-z][a-z0-9+.-]*$/;
// linkify throws on any other scheme (dots, `+`), so those are allowed in links but never autolinked
const LINKIFY_SCHEME = /^[0-9a-z]+(-[0-9a-z]+)*$/;

// linkify's scheme list is global: Link's own onDestroy resets it, so any round-trip check's throwaway
// editor would wipe the schemes of every live editor. Schemes only accumulate; isAllowedUri still gates each field.
const registeredSchemes = new Set<string>();

function registerSchemes(schemes: string[]): void {
	const missing = schemes.filter((scheme) => !registeredSchemes.has(scheme));
	if (missing.length === 0) return;

	missing.forEach((scheme) => registeredSchemes.add(scheme));
	// linkify ignores schemes registered after its first use until a reset
	reset();
	registeredSchemes.forEach((scheme) => registerCustomProtocol(scheme));
}

const SharedSchemeLink = Link.extend({
	onCreate() {
		registerSchemes(this.options.protocols.filter((protocol): protocol is string => typeof protocol === 'string'));
	},
	onDestroy() {},
});

// Link's default HTMLAttributes force target/rel on every link, rewriting same-tab links on round-trip
const LINK_OPTIONS: Partial<LinkOptions> = {
	defaultProtocol: 'https',
	openOnClick: false,
	HTMLAttributes: { target: null, rel: null },
};

export const BaseLink = SharedSchemeLink.configure(LINK_OPTIONS);

/** Extra URL schemes for text and image links, on top of Tiptap's defaults (http, https, mailto, ...). */
export function buildLinkProtocols(raw: unknown): { extensions: AnyExtension[]; protocols: string[]; key: string } {
	const protocols = parseProtocols(raw);
	if (protocols.length === 0) return { extensions: [], protocols: [], key: '' };

	const link = SharedSchemeLink.configure({
		...LINK_OPTIONS,
		protocols: protocols.filter((protocol) => LINKIFY_SCHEME.test(protocol)),
		isAllowedUri: (url) => isLinkAllowed(url, protocols),
	});

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

		if (SCHEME.test(scheme)) protocols.push(scheme);
		// eslint-disable-next-line no-console
		else console.warn('[wysiwyg] Ignored a linkProtocols entry that is not a URL scheme:', entry);
	}

	return [...new Set(protocols)].sort();
}
