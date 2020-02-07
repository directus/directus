import Vue from 'vue';
import VueCompositionAPI from '@vue/composition-api';
import VueRouter from 'vue-router';
import { VTooltip } from 'v-tooltip';

Vue.use(VueCompositionAPI);
Vue.use(VueRouter);
Vue.directive('tooltip', VTooltip);
