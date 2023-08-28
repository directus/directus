import { defineSecureEndpoint } from '@directus/extensions-sdk';

export default defineSecureEndpoint((router) => {
	router.get('/', (_req, res) => res.send('Hello, World!'));
});
