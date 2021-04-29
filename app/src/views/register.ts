import { App, defineAsyncComponent } from 'vue';
import PublicView from './public/';

// @TODO3 Investigate manual chunking
const PrivateView = defineAsyncComponent(() => import('./private'));

export function registerViews(app: App): void {
	app.component('public-view', PublicView);
	app.component('private-view', PrivateView);
}
