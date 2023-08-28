import { ExtensionAPI } from '@directus/extensions-sdk'

export declare global {
	namespace globalThis {
		var API: ExtensionAPI;
	}
}
