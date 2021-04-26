import { App } from 'vue';

import Focus from './focus/focus';
import Tooltip from './tooltip/tooltip';
import ClickOutside from './click-outside/click-outside';

export function registerDirectives(app: App) {
	app.directive('focus', Focus);
	app.directive('tooltip', Tooltip);
	app.directive('click-outside', ClickOutside);
}
