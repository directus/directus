import { App } from 'vue';
import ClickOutside from './click-outside';
import ContextMenu from './context-menu';
import Focus from './focus';
import PreventFocusout from './prevent-focusout';
import InputAutoWidth from './input-auto-width';
import Markdown from './markdown';
import Tooltip from './tooltip';

export function registerDirectives(app: App): void {
	app.directive('click-outside', ClickOutside);
	app.directive('context-menu', ContextMenu);
	app.directive('focus', Focus);
	app.directive('prevent-focusout', PreventFocusout);
	app.directive('input-auto-width', InputAutoWidth);
	app.directive('md', Markdown);
	app.directive('tooltip', Tooltip);
}
