import { defineHook } from '@directus/extensions-sdk';

export default defineHook(() => ({
	'items.create': () => {
		console.log('Item created!');
	},
}));
