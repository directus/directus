import { Directive, DirectiveBinding, watch } from 'vue';

type Handler = (event: Event) => void;
type Middleware = (event: Event) => boolean;

type DirectiveConfig = {
	handler: Handler;
	middleware: Middleware;
	events: string[];
	disabled: boolean;
};

type BindingValue = {
	value: Handler | Partial<DirectiveConfig>;
	oldValue?: Handler | Partial<DirectiveConfig>;
};

interface ClickOutsideElement extends HTMLElement {
	$clickOutsideHandlers: {
		event: string;
		handler: (event: Event) => void;
	}[];
}

const beforeMount = (el: HTMLElement, { value }: Partial<DirectiveBinding>): void => {
	const { handler, middleware, events, disabled } = processValue(value);

	watch(
		() => value,
		(newVal) => {
			if (JSON.stringify(newVal) !== JSON.stringify(value)) {
				updated(el, { value: newVal, oldValue: null });
			}
		}
	);

	if (disabled === true) return;

	(el as ClickOutsideElement).$clickOutsideHandlers = events.map((event) => ({
		event,
		handler: (event) => onEvent({ event, el: el as ClickOutsideElement, handler, middleware }),
	}));

	(el as ClickOutsideElement).$clickOutsideHandlers.forEach(({ event, handler }) => {
		setTimeout(() => {
			if (!(el as ClickOutsideElement).$clickOutsideHandlers) return;
			document.documentElement.addEventListener(event, handler, false);
		});
	});
};

const unmounted = (el: HTMLElement): void => {
	const handlers = (el as ClickOutsideElement).$clickOutsideHandlers || [];

	handlers.forEach(({ event, handler }) => {
		document.documentElement.removeEventListener(event, handler, false);
	});
};

const updated = (el: HTMLElement, { value, oldValue }: Partial<DirectiveBinding>): void => {
	if (JSON.stringify(value) === JSON.stringify(oldValue)) {
		return;
	}

	unmounted(el);
	beforeMount(el, { value });
};

export const directive: Directive = {
	beforeMount,
	unmounted,
	updated,
};

export default directive;

export function processValue(bindingValue: BindingValue['value']): DirectiveConfig {
	const isFunction = typeof bindingValue === 'function';

	let value: DirectiveConfig;

	if (isFunction) {
		const binding = bindingValue as Handler;

		value = {
			handler: binding,
			middleware: () => true,
			events: ['pointerdown'],
			disabled: false,
		};
	} else {
		const binding = bindingValue as Partial<DirectiveConfig>;

		value = {
			handler: binding.handler || (() => undefined),
			middleware: binding.middleware || (() => true),
			events: binding.events || ['pointerdown'],
			disabled: binding.disabled !== undefined ? !!binding.disabled : false,
		};
	}

	return value;
}

export function onEvent({
	el,
	event,
	handler,
	middleware,
}: {
	el: ClickOutsideElement;
	event: Event;
	handler: Handler;
	middleware: Middleware;
}): void {
	event.stopPropagation();
	const path = event.composedPath();
	const isClickOutside = path ? path.indexOf(el) < 0 : el.contains(event.target as Element) === false;

	if (isClickOutside === false) return;

	if (middleware(event)) {
		handler(event);
	}
}
