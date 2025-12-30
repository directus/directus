import { register } from './register';
import Wrapper from './wrapper.vue';
import datetimeFormats from '@/lang/date-formats.yaml';
import numberFormats from '@/lang/number-formats.yaml';
import enUSBase from '@/lang/translations/en-US.yaml';
import { defineSetupVue3 } from '@histoire/plugin-vue';
import { createHead } from '@unhead/vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter } from 'vue-router';

export const setupVue3 = defineSetupVue3(({ app, addWrapper }) => {
	app.use(
		createRouter({
			history: createMemoryHistory(),
			routes: [{ path: '/:catchAll(.*)', name: 'all', component: { render: () => null } }],
		}),
	);

	app.use(
		createI18n({
			legacy: false,
			locale: 'en-US',
			fallbackLocale: 'en-US',
			messages: {
				'en-US': enUSBase,
			},
			silentTranslationWarn: true,
			datetimeFormats,
			numberFormats,
		}),
	);

	app.use(createPinia());

	app.use(createHead());

	register(app);

	addWrapper(Wrapper);
});
