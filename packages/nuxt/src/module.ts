import { resolve } from 'path';
import { fileURLToPath } from 'url';
import defu from 'defu';
import { defineNuxtModule, addPlugin } from '@nuxt/kit';

interface ModuleAuthOptions {
	/**
	 * Static token
	 * @type string
	 */
	token?: string;

	/**
	 * Email of user to authenticate as
	 * @type string
	 */
	email?: string;

	/**
	 * Password of user to authenticate as
	 * @type string
	 */
	password?: string;
}

export interface ModuleOptions {
	/**
	 * Directus URL
	 * @default 'http://localhost:8055'
	 * @type string
	 */
	url: string;

	/**
	 * Authentication credentials. These will be used server-side.
	 * @type ModuleAuthOptions
	 */
	auth?: ModuleAuthOptions;
}

declare module '@nuxt/schema' {
	interface ConfigSchema {
		publicRuntimeConfig: {
			directus?: ModuleOptions;
		};
	}
}

export default defineNuxtModule<ModuleOptions>({
	meta: {
		name: '@directus/nuxt',
		configKey: 'directus',
		compatibility: {
			nuxt: '^3.0.0 || ^2.16.0',
			bridge: true,
		},
	},
	setup(options, nuxt) {
		nuxt.options.publicRuntimeConfig.directus = defu(nuxt.options.publicRuntimeConfig.directus, {
			url: options.url,
			auth: options.auth || {},
		});

		if (!nuxt.options.publicRuntimeConfig.directus.url) {
			throw new Error('[directus] Missing `url`');
		}

		const runtimeDir = fileURLToPath(new URL('./runtime', import.meta.url));
		nuxt.options.build.transpile.push(runtimeDir);

		addPlugin(resolve(runtimeDir, 'plugin'));
	},
});
