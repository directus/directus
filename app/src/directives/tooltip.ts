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

const FOCUSABLE = ['button', 'a[href]', 'input', 'select', 'textarea', '[tabindex]'];

const FOCUSABLE_SELECTOR = FOCUSABLE.join(', ');
const FOCUSABLE_CHILD_SELECTOR = FOCUSABLE.map((selector) => `:scope > ${selector}`).join(', ');

export function resolveTrigger(element: HTMLElement): HTMLElement {
	if (element.matches(FOCUSABLE_SELECTOR)) {
		return element;
	}

	return element.querySelector<HTMLElement>(FOCUSABLE_CHILD_SELECTOR) ?? element;
}

interface TooltipHandlers {
	trigger: HTMLElement;
	enter: () => void;
	leave: () => void;
	focus: () => void;
	blur: () => void;
}

export interface TooltipValue {
	text: string;
	kbd?: string[];
}

export function resolveTooltipValue(value: string | TooltipValue): { content: string; kbd: string[] | undefined } {
	if (typeof value === 'string') return { content: value, kbd: undefined };
	return { content: value.text, kbd: value.kbd };
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

function mounted(element: HTMLElement, binding: DirectiveBinding): void {
	if (!binding.value) return;

	const trigger = resolveTrigger(element);
	const virtualRef = { getBoundingClientRect: () => element.getBoundingClientRect() };
	const { content, kbd } = resolveTooltipValue(binding.value);

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

	const enter = () => {
		let delay = 500;
		if (binding.modifiers['instant']) delay = 0;
		else if (isDisabled(element)) delay = 125;
		openTooltip(buildPayload(delay));
	};

	const focus = () => {
		if (!trigger.matches(':focus-visible')) {
			return;
		}

		openTooltip(buildPayload(binding.modifiers['instant'] ? 0 : 500), true);
	};

	const leave = closeTooltip;
	const blur = closeTooltip;

	handlerMap.set(element, { trigger, enter, leave, focus, blur });
	element.addEventListener('mouseenter', enter);
	element.addEventListener('mouseleave', leave);
	trigger.addEventListener('focus', focus);
	trigger.addEventListener('blur', blur);
	trigger.setAttribute('aria-describedby', TOOLTIP_CONTENT_ID);
}

function unmounted(element: HTMLElement): void {
	const handlers = handlerMap.get(element);

	if (handlers) {
		element.removeEventListener('mouseenter', handlers.enter);
		element.removeEventListener('mouseleave', handlers.leave);
		handlers.trigger.removeEventListener('focus', handlers.focus);
		handlers.trigger.removeEventListener('blur', handlers.blur);
		handlerMap.delete(element);
		handlers.trigger.removeAttribute('aria-describedby');
		closeTooltip();
	}
}

const Tooltip: Directive = {
	mounted,
	unmounted,
	updated(element, binding) {
		const handlers = handlerMap.get(element);

		const triggerChanged = handlers !== undefined && resolveTrigger(element) !== handlers.trigger;

		if (binding.value === binding.oldValue && !triggerChanged) return;

		unmounted(element);

		if (binding.value) {
			mounted(element, binding);
		}
	},
};

export default Tooltip;
