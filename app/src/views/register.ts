import { App } from 'vue';

import PublicView from './public/';

import PrivateView from './private';
// @TODO3 make this an async component again:
// const PrivateView = () => import(/* webpackChunkName: "private-view" */ './private');

export function registerViews(app: App) {
	app.component('public-view', PublicView);
	app.component('private-view', PrivateView);
}
