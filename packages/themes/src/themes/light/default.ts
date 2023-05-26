import { defineTheme } from '../../define-theme.js';

export default defineTheme({
	name: 'Directus Default (Light)',
	appearance: 'light',
	rules: {
		foreground: '#000',
		'header.foreground': '#ff0000',
		'header.title.family': '',
		'header.title.size': '42px',
		'header.title.weight': 700,
	},
});
