import { App, defineAsyncComponent } from 'vue';
import PublicView from './public/';

const PrivateView = defineAsyncComponent(() => import('./private'));

export function registerViews(app: App): void {
	app.component('PublicView', PublicView);
	app.component('PrivateView', PrivateView);
}
