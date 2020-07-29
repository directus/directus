import { addParameters } from '@storybook/vue';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

import "../src/styles/main.scss";
import "../src/plugins";
import "../src/components/register";
import "../src/directives/register";
import "../src/interfaces/register";
import "../src/displays/register";
import "../src/views/register";
import "../src/layouts/register";

addParameters({
	docs: {
		inlineStories: true
	},
	viewport: {
		viewports: INITIAL_VIEWPORTS
	},
	themes: [
		{ name: 'Light', class: ['private-view', 'light'], color: '#ffffff', default: true },
		{ name: 'Dark', class: ['private-view', 'dark'], color: '#263238' },
	]
});
