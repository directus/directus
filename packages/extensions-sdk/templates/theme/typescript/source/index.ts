import { defineTheme } from '@directus/extensions-sdk';

export default defineTheme({
	id: 'custom',
	name: 'My Custom Theme',
	appearance: 'light',
	rules: {
		background: '#fff',
		foreground: '#333',

		navigation: {
			modules: {
				background: 'tomato',
			},
		},
	},
});
