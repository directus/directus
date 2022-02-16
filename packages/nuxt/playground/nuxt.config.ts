import { defineNuxtConfig } from 'nuxt3';
import DirectusModule from '..';

export default defineNuxtConfig({
	modules: [DirectusModule],
	directus: {
		url: 'http://localhost:8055',
	},
});
