import type { ReferenceElement } from 'reka-ui';
import type { Directive, DirectiveBinding } from 'vue';

export const TOOLTIP_CONTENT_ID = 'app-tooltip-content';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipPayload {
	content: string;
	kbd?: string[];
	side: TooltipSide;
	align: TooltipAlign;
	inverted: boolean;
	monospace: boolean;
	delayDuration: number;
	virtualRef: ReferenceElement | null;
}

export function isDisabled(element: HTMLElement): boolean {
	return (
		element.hasAttribute('disabled') ||
		element.getAttribute('aria-disabled') === 'true' ||
		element.querySelector(':scope > :disabled, :scope > [aria-disabled="true"]') !== null
	);
}

const SIDES: TooltipSide[] = ['top', 'bottom', 'left', 'right'];

export function resolveSide(binding: DirectiveBinding): TooltipSide {
	return SIDES.find((s) => binding.modifiers[s] || binding.arg === s) ?? 'top';
}

const ALIGNS: TooltipAlign[] = ['start', 'center', 'end'];

export function resolveAlign(binding: DirectiveBinding): TooltipAlign {
	return ALIGNS.find((a) => binding.modifiers[a]) ?? 'center';
}

interface TooltipHandlers {
	enter: () => void;
	leave: () => void;
	focusin: (event: FocusEvent) => void;
	focusout: (event: FocusEvent) => void;
	cleanup: () => void;
}

function addDescribedBy(element: HTMLElement): void {
	const ids = element.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];

	if (!ids.includes(TOOLTIP_CONTENT_ID)) {
		element.setAttribute('aria-describedby', [...ids, TOOLTIP_CONTENT_ID].join(' '));
	}
}

function removeDescribedBy(element: HTMLElement): void {
	const ids = element.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean) ?? [];
	const remaining = ids.filter((id) => id !== TOOLTIP_CONTENT_ID);

	if (remaining.length > 0) {
		element.setAttribute('aria-describedby', remaining.join(' '));
	} else {
		element.removeAttribute('aria-describedby');
	}
}

export interface TooltipValue {
	text: string;
	kbd?: string[];
}

export function resolveTooltipValue(value: string | TooltipValue): { content: string; kbd: string[] | undefined } {
	if (typeof value === 'string') return { content: value, kbd: undefined };
	return { content: value.text, kbd: value.kbd };
}

/** Whether two tooltip binding values would render the same tooltip. */
export function isSameTooltipValue(
	a: string | TooltipValue | false | null | undefined,
	b: string | TooltipValue | false | null | undefined,
): boolean {
	if (a === b) {
		return true;
	}

	if (!a || !b) {
		return false;
	}

	const resolvedA = resolveTooltipValue(a);
	const resolvedB = resolveTooltipValue(b);

	return resolvedA.content === resolvedB.content && resolvedA.kbd?.join() === resolvedB.kbd?.join();
}

interface TooltipState extends Omit<TooltipPayload, 'delayDuration'> {
	open: boolean;
}

const state: TooltipState = {
	open: false,
	content: '',
	kbd: undefined,
	side: 'top',
	align: 'center',
	inverted: false,
	monospace: false,
	virtualRef: null,
};

let timer: ReturnType<typeof setTimeout> | null = null;
let onChange: (() => void) | null = null;

function notify(): void {
	onChange?.();
}

function openTooltip(payload: TooltipPayload, immediateContent = false): void {
	if (timer) clearTimeout(timer);

	if (immediateContent) {
		state.content = payload.content;
		notify();
	}

	timer = setTimeout(() => {
		const { delayDuration: _, kbd, ...rest } = payload;
		Object.assign(state, rest);
		state.kbd = kbd;
		state.open = true;
		notify();
	}, payload.delayDuration);
}

function closeTooltip(): void {
	if (timer) clearTimeout(timer);
	timer = null;
	state.open = false;
	notify();
}

export function getGlobalTooltip() {
	return {
		state,
		openTooltip,
		closeTooltip,
		watch: (cb: () => void) => {
			onChange = cb;

			return () => {
				onChange = null;
			};
		},
	};
}

const handlerMap = new WeakMap<HTMLElement, TooltipHandlers>();

function beforeMount(element: HTMLElement, binding: DirectiveBinding): void {
	if (!binding.value) return;

	const virtualRef = { getBoundingClientRect: () => element.getBoundingClientRect() };
	const { content, kbd } = resolveTooltipValue(binding.value);
	let described: HTMLElement | null = null;

	const buildPayload = (delayDuration: number) => ({
		content,
		kbd,
		side: resolveSide(binding),
		align: resolveAlign(binding),
		inverted: !!binding.modifiers['inverted'],
		monospace: !!binding.modifiers['monospace'],
		delayDuration,
		virtualRef,
	});

	// Focus belongs to this tooltip unless a closer tooltip host or an opted-out element sits in between
	const owns = (node: EventTarget | null): node is HTMLElement => {
		if (!(node instanceof HTMLElement) || !element.contains(node)) {
			return false;
		}

		for (let current: HTMLElement | null = node; current && current !== element; current = current.parentElement) {
			if (handlerMap.has(current) || current.hasAttribute('data-no-tooltip')) {
				return false;
			}
		}

		return true;
	};

	const enter = () => {
		let delay = 500;
		if (binding.modifiers['instant']) delay = 0;
		else if (isDisabled(element)) delay = 125;
		openTooltip(buildPayload(delay));
	};

	// focusin/focusout bubble, so this also works when the directive sits on a wrapper around the focusable element
	const focusin = (event: FocusEvent) => {
		const target = event.target;

		if (!owns(target)) {
			return;
		}

		addDescribedBy(target);
		described = target;

		// Mouse clicks also move focus, but hover already handles those
		if (!target.matches(':focus-visible')) {
			return;
		}

		openTooltip(buildPayload(binding.modifiers['instant'] ? 0 : 500), true);
	};

	const focusout = (event: FocusEvent) => {
		if (described && event.target === described) {
			removeDescribedBy(described);
			described = null;
		}

		if (owns(event.relatedTarget)) {
			return;
		}

		closeTooltip();
	};

	const cleanup = () => {
		if (described) {
			removeDescribedBy(described);
			described = null;
		}
	};

	const leave = closeTooltip;

	handlerMap.set(element, { enter, leave, focusin, focusout, cleanup });
	element.addEventListener('mouseenter', enter);
	element.addEventListener('mouseleave', leave);
	element.addEventListener('focusin', focusin);
	element.addEventListener('focusout', focusout);

	// A value change re-binds while the control may still be focused or hovered, and no new event will fire
	const active = document.activeElement;

	if (owns(active)) {
		addDescribedBy(active);
		described = active;
	}

	if (described?.matches(':focus-visible') || element.matches(':hover')) {
		openTooltip(buildPayload(0), true);
	}
}

function unmounted(element: HTMLElement): void {
	const handlers = handlerMap.get(element);

	if (handlers) {
		element.removeEventListener('mouseenter', handlers.enter);
		element.removeEventListener('mouseleave', handlers.leave);
		element.removeEventListener('focusin', handlers.focusin);
		element.removeEventListener('focusout', handlers.focusout);
		handlers.cleanup();
		handlerMap.delete(element);
		closeTooltip();
	}
}

const Tooltip: Directive = {
	beforeMount,
	unmounted,
	updated(element, binding) {
		if (isSameTooltipValue(binding.value, binding.oldValue)) return;
		unmounted(element);

		if (binding.value) {
			beforeMount(element, binding);
		}
	},
};

export default Tooltip;
