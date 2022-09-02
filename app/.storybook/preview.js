import '../src/styles/main.scss';
import './styles.scss';
import { useArgs } from '@storybook/client-api';
import { app } from '@storybook/vue3';
import { createRouter, createWebHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import { register } from './register';
import { fix } from './fix-actions';

const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
		},
	],
});

const i18n = createI18n();

export const decorators = [
	(Story, { args, argTypes }) => {
		const [_, update] = useArgs();
		const newArgs = fix(args, argTypes, update);
		return {
			args: newArgs,
			template: '<story />',
		};
	},
];

export const parameters = {
	// actions: { argTypesRegex: "(change|emoji-selected|update:.*?)" },
	controls: {
		matchers: {
			color: /(background|color)$/i,
			date: /Date$/,
		},
	},
};

app.use(router);
app.use(i18n);

register(app);
