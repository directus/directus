import DefaultTheme from 'vitepress/theme';
import { createHead } from '@vueuse/head';

import Layout from './DocLayout.vue';

import './vars.css';
import './overrides.css';
import './icons.css';

export default {
	...DefaultTheme,
	Layout,
	enhanceApp(ctx) {
		DefaultTheme.enhanceApp(ctx);
		const head = createHead();
		ctx.app.use(head);
	},
};
