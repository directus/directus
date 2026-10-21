import { isAllowedUri } from '@tiptap/extension-link';

// script-capable schemes, as blocked by the legacy TinyMCE editor; any other scheme (e.g. `myapp://`) is kept
const UNSAFE_PROTOCOLS = ['javascript:', 'vbscript:', 'data:', 'mhtml:'];

export function isAllowedLinkUri(uri: string | undefined): boolean {
	if (isAllowedUri(uri)) return true;

	// The URL parser normalizes case/whitespace obfuscation (" JaVaScRiPt:…") before the protocol check.
	try {
		return !UNSAFE_PROTOCOLS.includes(new URL(uri!, 'http://relative-url').protocol);
	} catch {
		return false;
	}
}
