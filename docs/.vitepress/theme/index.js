import DefaultTheme from 'vitepress/theme';
import { enhanceAppWithTabs } from 'vitepress-plugin-tabs/client';

import Article from '../components/Article.vue';
import Button from '../components/Button.vue';
import Card from '../components/Card.vue';
import Contributors from '../components/Contributors.vue';
import Divider from '../components/Divider.vue';
import SnippetToggler from '../components/SnippetToggler.vue';
import Tabs from '../components/Tabs.vue';
import Layout from './Layout.vue';

import './icons.css';
import './overrides.css';
import './vars.css';

export default {
	extends: DefaultTheme,
	Layout,
	enhanceApp({ app }) {
		enhanceAppWithTabs(app);
		app.component('Article', Article);
		app.component('Button', Button);
		app.component('Card', Card);
		app.component('Contributors', Contributors);
		app.component('Divider', Divider);
		app.component('SnippetToggler', SnippetToggler);
		app.component('Tabs', Tabs);
	},
};
