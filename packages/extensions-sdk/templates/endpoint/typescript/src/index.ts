import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint((router) => {
	router.get('/', (req, res) => res.send('Hello, World!'));
});
