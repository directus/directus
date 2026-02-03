/* eslint-disable no-console  */

// Note: the import order is important. Vue has to come first. (Unhead will break if that's first)
// eslint-disable-next-line import/order
import { createApp } from 'vue';

import { createHead } from '@unhead/vue';
import { createPinia } from 'pinia';
import App from './app.vue';
import { registerComponents } from './components/register';
import { DIRECTUS_LOGO } from './constants';
import { registerDirectives } from './directives/register';
import { loadExtensions, registerExtensions } from './extensions';
import { i18n } from './lang/';
import { router } from './router';
import './styles/main.scss';
import '@directus/vue-split-panel/index.css';
import { registerViews } from './views/register';
import { getVueComponentName } from '@/utils/get-vue-component-name';

init();

async function init() {
	console.log(DIRECTUS_LOGO);

	console.info(
		`Hey! Interested in helping build this open-source data management platform?\nIf so, join our growing team of contributors at: https://directus.chat`,
	);

	console.info(`%c🐰 Starting Directus...`, 'color:Green');

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

	console.info(`%cEnvironment: ${import.meta.env.MODE}`, 'color:DodgerBlue');
	console.groupEnd();

	// Prevent the browser from opening files that are dragged on the window
	window.addEventListener('dragover', (e) => e.preventDefault(), false);
	window.addEventListener('drop', (e) => e.preventDefault(), false);
}
