/* eslint-disable no-console */

import { Directus } from '@directus/sdk';
import { ModuleOptions } from '../module';
import { defineNuxtPlugin, NuxtApp, useRuntimeConfig } from '#app';

export default defineNuxtPlugin(async (_nuxtApp: NuxtApp) => {
	const { url, auth } = useRuntimeConfig().directus as ModuleOptions;

	const directusClient = new Directus(url);

	if (process.server && !directusClient.auth.token) {
		if (auth.token) {
			try {
				await directusClient.auth.static(auth.token);
				console.log(`[directus] Logged in using provided token`);
			} catch (err) {
				console.error(`[directus] Failed to login using provided token.`);
			}
		} else if (auth.email && auth.password) {
			try {
				await directusClient.auth.login({ email: auth.email, password: auth.password });
				console.error(`[directus] Logged in using provided email & password`);
			} catch (err) {
				console.error(`[directus] Failed to login using provided email & password.`);
			}
		}
	}

	return {
		provide: {
			directus: directusClient,
		},
	};
});
