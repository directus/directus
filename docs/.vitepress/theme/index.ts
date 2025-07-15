/* eslint-disable vue/multi-word-component-names */
/* eslint-disable vue/no-reserved-component-names */
import type { Theme } from 'vitepress';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';
import DefaultTheme from 'vitepress/theme';

import Article from '../components/Article.vue';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import Divider from '../components/Divider.vue';
import GuideMeta from '../components/GuideMeta.vue';
import Meta from '../components/Meta.vue';
import SnippetToggler from '../components/SnippetToggler.vue';
import Tabs from '../components/Tabs.vue';
import Layout from './Layout.vue';

import './icons.css';
import './overrides.css';
import './vars.css';

const theme: Theme = {
	extends: DefaultTheme,
	Layout,
	enhanceApp({ app }) {
		enhanceAppWithTabs(app);
		app.component('Article', Article);
		app.component('Button', Button);
		app.component('Card', Card);
		app.component('GuideMeta', GuideMeta);
		app.component('Meta', Meta);
		app.component('Divider', Divider);
		app.component('SnippetToggler', SnippetToggler);
		app.component('Tabs', Tabs);
	},
};

export default theme;
