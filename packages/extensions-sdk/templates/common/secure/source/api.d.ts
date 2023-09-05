import { ExtensionAPI } from '@directus/extensions-sdk'

export declare global {
	namespace globalThis {
		var API: ExtensionAPI;
	}

	// override the global console
	// Doesn't work at the moment because TypeScript merges interfaces by default
	interface Console extends ConsoleSecure { }
}
