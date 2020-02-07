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
	}
});
