import { ExecFunction } from '@directus/extensions-sdk'

export declare global {
	namespace globalThis {
		var exec: ExecFunction;
	}
}
