import { createHead } from '@unhead/vue';
import DefaultTheme from 'vitepress/theme';

import Card from '../components/Card.vue';
import Contributors from '../components/Contributors.vue';
import Tabs from '../components/Tabs.vue';
import Layout from './DocLayout.vue';

import './icons.css';
import './overrides.css';
import './vars.css';

export default {
	...DefaultTheme,
	Layout,
	enhanceApp(ctx) {
		DefaultTheme.enhanceApp(ctx);
		const head = createHead();
		ctx.app.use(head);
		ctx.app.component('Card', Card);
		ctx.app.component('Contributors', Contributors);
		ctx.app.component('Tabs', Tabs);
	},
};
