import { App } from 'vue';
import ClickOutside from './click-outside/click-outside';
import ContextMenu from './context-menu/context-menu';
import Focus from './focus/focus';
import Tooltip from './tooltip/tooltip';
import Markdown from './markdown';

export function registerDirectives(app: App): void {
	app.directive('click-outside', ClickOutside);
	app.directive('context-menu', ContextMenu);
	app.directive('focus', Focus);
	app.directive('tooltip', Tooltip);
	app.directive('md', Markdown);
}
