import Vue from 'vue';

import PublicView from './public/';
const PrivateView = () => import(/* webpackChunkName: "private-view" */ './private-view/');

Vue.component('public-view', PublicView);
Vue.component('private-view', PrivateView);
