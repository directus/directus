import { addParameters } from '@storybook/vue';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

import "../src/styles/main.scss";
import "../src/plugins";

addParameters({
	docs: {
		inlineStories: true
	},
	viewport: {
		viewports: INITIAL_VIEWPORTS
	},
	themes: [
		{ name: 'Light', class: ['private', 'light'], color: '#ffffff', default: true },
		{ name: 'Dark', class: ['private', 'dark'], color: '#263238' },
	]
});
