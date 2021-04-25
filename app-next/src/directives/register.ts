import Vue from 'vue';

import Focus from './focus/focus';
import Tooltip from './tooltip/tooltip';
import ClickOutside from './click-outside/click-outside';

Vue.directive('focus', Focus);
Vue.directive('tooltip', Tooltip);
Vue.directive('click-outside', ClickOutside);
