import { withKnobs } from '@storybook/addon-knobs';
import Vue from 'vue';
import PublicView from './public-view.vue';
import markdown from './readme.md';

Vue.component('public-view', PublicView);

export default {
	title: 'Views / Public',
	component: PublicView,
	decorators: [withKnobs],
	parameters: {
		notes: markdown,
	},
};

export const basic = () => `
<public-view>
	<h1 class="type-title" style="margin-bottom: 2rem">Directus</h1>
	Hello from the default slot!
</public-view>`;
