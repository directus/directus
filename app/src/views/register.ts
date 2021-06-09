import { App, defineAsyncComponent } from 'vue';
import PublicView from './public/';

const PrivateView = defineAsyncComponent(() => import('./private'));

export function registerViews(app: App): void {
	app.component('public-view', PublicView);
	app.component('private-view', PrivateView);
}
