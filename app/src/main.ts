/* eslint-disable no-console */

import { getVueComponentName } from '@/utils/get-vue-component-name';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue';
import { createApp } from 'vue';
import App from './app.vue';
import { registerComponents } from './components/register';
import { DIRECTUS_LOGO } from './constants';
import { registerDirectives } from './directives/register';
import { loadExtensions, registerExtensions } from './extensions';
import { i18n } from './lang/';
import { router } from './router';
import './styles/main.scss';
import { registerViews } from './views/register';

init();

async function init() {
	const version = __DIRECTUS_VERSION__;

	console.log(DIRECTUS_LOGO);

	console.info(
		`Hey! Interested in helping build this open-source data management platform?\nIf so, join our growing team of contributors at: https://directus.chat`
	);

	if (import.meta.env.DEV) {
		console.info(`%c🐰 Starting Directus v${version}...`, 'color:Green');
	} else {
		console.info(`%c🐰 Starting Directus...`, 'color:Green');
	}

	console.time('🕓 Application Loaded');

	const app = createApp(App);

	app.use(i18n);
	app.use(createPinia());
	app.use(createHead());

	app.config.errorHandler = (err, vm, info) => {
		const source = getVueComponentName(vm);
		console.warn(`[app-${source}-error] ${info}`);
		console.warn(err);
		return false;
	};

	registerDirectives(app);
	registerComponents(app);
	registerViews(app);

	await loadExtensions();
	registerExtensions(app);

	// Add router after loading of extensions to ensure all routes are registered
	app.use(router);

	app.mount('#app');

	console.timeEnd('🕓 Application Loaded');

	console.group(`%c✨ Project Information`, 'color:DodgerBlue'); // groupCollapsed

	if (import.meta.env.DEV) {
		console.info(`%cVersion: v${version}`, 'color:DodgerBlue');
	}

	console.info(`%cEnvironment: ${import.meta.env.MODE}`, 'color:DodgerBlue');
	console.groupEnd();

	// Prevent the browser from opening files that are dragged on the window
	window.addEventListener('dragover', (e) => e.preventDefault(), false);
	window.addEventListener('drop', (e) => e.preventDefault(), false);
}
