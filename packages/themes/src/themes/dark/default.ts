import { defineTheme } from '../../define-theme.js';

export default defineTheme({
	name: 'Directus Default (Dark)',
	appearance: 'dark',
	rules: {
		foreground: '#000',
		'header.foreground': '#fff',
		'header.title.family': '',
		'header.title.size': '42px',
		'header.title.weight': 700,
	},
});
