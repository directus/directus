import { App } from 'vue';
import Focus from './focus/focus';
import Tooltip from './tooltip/tooltip';

export function registerDirectives(app: App): void {
	app.directive('focus', Focus);
	app.directive('tooltip', Tooltip);
	app.directive('click-outside', ClickOutside);
}
