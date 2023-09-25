import '../src/styles/main.scss';
import './styles.scss';
import { useArgs } from '@storybook/client-api';
import { Preview, setup } from '@storybook/vue3';
import { createRouter, createWebHistory } from 'vue-router';
import { createI18n } from 'vue-i18n';
import { register } from './register';
import { fix } from './fix-actions';

setup((app) => {
	const router = createRouter({
		history: createWebHistory(),
		routes: [
			{
				name: 'Home',
				path: '/:_(.+)+',
				component: { template: '<div>Home</div>' },
			} as any,
		],
	});

	const i18n = createI18n({
		locale: 'en-US',
		legacy: false,
		messages: {
			'en-US': {
				edit: 'Edit',
				copy_to: 'Copy to...',
				delete: 'Delete',
				duplicate: 'Duplicate',
			},
		},
	});

	app.use(router);
	app.use(i18n);
	register(app);
});

const preview: Preview = {
	decorators: [
		(_, { args, argTypes }) => {
			const [__, update] = useArgs();
			const newArgs = fix(args, argTypes, update);
			return {
				args: newArgs,
				template: '<story />',
			};
		},
	],
	parameters: {
		// actions: { argTypesRegex: "(change|emoji-selected|update:.*?)" },
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/,
			},
		},
	},
};

export default preview;
