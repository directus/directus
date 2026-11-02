import { isAllowedUri, Link, type LinkOptions } from '@tiptap/extension-link';
import type { AnyExtension } from '@tiptap/vue-3';
import { CustomImage } from './image';
import { checkLinkScheme } from './link-scheme';

// Link's default HTMLAttributes force target/rel on every link, rewriting same-tab links on round-trip
const LINK_OPTIONS: Partial<LinkOptions> = {
	defaultProtocol: 'https',
	openOnClick: false,
	HTMLAttributes: { target: null, rel: null },
};

export const BaseLink = Link.configure(LINK_OPTIONS);

/** Link and image extensions that also allow the field's extra URL schemes, on top of Tiptap's defaults. */
export function buildLinkProtocolSchema(raw: unknown): {
	extensions: AnyExtension[];
	protocols: string[];
	key: string;
} {
	const protocols = parseProtocols(raw);
	if (protocols.length === 0) return { extensions: [], protocols: [], key: '' };

	// not passed as `protocols`, which would register them with linkify for autolink
	const link = Link.configure({ ...LINK_OPTIONS, isAllowedUri: (url) => Boolean(isAllowedUri(url, protocols)) });

	return {
		extensions: [link, CustomImage.configure({ linkProtocols: protocols })],
		protocols,
		key: protocols.join(','),
	};
}

function parseProtocols(raw: unknown): string[] {
	if (!Array.isArray(raw)) return [];

	const protocols: string[] = [];

	for (const entry of raw) {
		if (typeof entry !== 'string' || entry.trim() === '') continue;

		const { scheme, problem } = checkLinkScheme(entry);

		if (!problem) protocols.push(scheme);
		// eslint-disable-next-line no-console
		else console.warn('[wysiwyg] Ignored a linkProtocols entry that is not an allowed URL scheme:', entry);
	}

	return [...new Set(protocols)].sort();
}
