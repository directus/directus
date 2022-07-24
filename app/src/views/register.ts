import { App, defineAsyncComponent } from 'vue';
import PublicView from './public/';
import SharedView from './shared/shared-view.vue';

const PrivateView = defineAsyncComponent(() => import('./private'));
const DrawerItem = defineAsyncComponent(() => import('./private/components/drawer-item.vue'));

export function registerViews(app: App): void {
	app.component('PublicView', PublicView);
	app.component('PrivateView', PrivateView);
	app.component('SharedView', SharedView);
	app.component('DrawerItem', DrawerItem);
}
