import { defineSetupVue3 } from '@histoire/plugin-vue';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';

export const setupVue3 = defineSetupVue3(({ app }) => {
	app.use(
		createRouter({
			history: createMemoryHistory(),
			routes: [{ path: '/:catchAll(.*)', name: 'all', component: { render: () => null } }],
		}),
	);

	app.use(createI18n({}));
});
