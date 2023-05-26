import { defineTheme } from '../../define-theme.js';

export default defineTheme({
	name: 'Directus Default (Light)',
	type: 'light',
	rules: {
		foreground: '#000',
		'header.foreground': '#fff',
		'header.title.family': '',
		'header.title.size': '42px',
		'header.title.weight': 700,
	},
});
