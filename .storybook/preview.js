import Vue from "vue";
import VueCompositionAPI from "@vue/composition-api";
import { addParameters } from '@storybook/vue';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';

import "../src/design/_base.scss";
import "../src/design/_fonts.scss";
import "../src/design/_variables.scss";

Vue.use(VueCompositionAPI);

addParameters({
	docs: {
		inlineStories: true
	},
	viewport: {
		viewports: INITIAL_VIEWPORTS
	}
});
