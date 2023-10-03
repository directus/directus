import { exec } from '@directus/extensions-sdk'

export declare global {
	namespace globalThis {
		var exec: exec;
	}
}
