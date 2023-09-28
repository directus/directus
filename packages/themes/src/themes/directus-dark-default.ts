import type { Theme } from '../schema.js';

export const theme: Theme = {
	name: 'Directus Dark (Default)',
	appearance: 'dark',
	variables: {
		red: 'tomato',
	},
	rules: {
		foreground: 'white',
		background: 'black',
		moduleBar: {
			background: 'white',
			foreground: 'black',
		},
	},
};
