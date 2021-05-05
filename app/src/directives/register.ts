import Vue from 'vue';
import ClickOutside from './click-outside/click-outside';
import Focus from './focus/focus';
import Tooltip from './tooltip/tooltip';

Vue.directive('focus', Focus);
Vue.directive('tooltip', Tooltip);
Vue.directive('click-outside', ClickOutside);
