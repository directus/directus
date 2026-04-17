import type { Directive, DirectiveBinding } from 'vue';
import {
	TOOLTIP_CONTENT_ID,
	type TooltipAlign,
	type TooltipSide,
	useGlobalTooltip,
} from '@/composables/use-global-tooltip';

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

const handlerMap = new WeakMap<HTMLElement, TooltipHandlers>();
const { openTooltip, closeTooltip } = useGlobalTooltip();

function beforeMount(element: HTMLElement, binding: DirectiveBinding): void {
	if (!binding.value) return;

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
		openTooltip(buildPayload(binding.modifiers['instant'] ? 0 : 500), true);
	};

	const leave = closeTooltip;
	const blur = closeTooltip;

	handlerMap.set(element, { enter, leave, focus, blur });
	element.addEventListener('mouseenter', enter);
	element.addEventListener('mouseleave', leave);
	element.addEventListener('focus', focus);
	element.addEventListener('blur', blur);
	element.setAttribute('aria-describedby', TOOLTIP_CONTENT_ID);
}

function unmounted(element: HTMLElement): void {
	const handlers = handlerMap.get(element);

	if (handlers) {
		element.removeEventListener('mouseenter', handlers.enter);
		element.removeEventListener('mouseleave', handlers.leave);
		element.removeEventListener('focus', handlers.focus);
		element.removeEventListener('blur', handlers.blur);
		handlerMap.delete(element);
		element.removeAttribute('aria-describedby');
		closeTooltip();
	}
}

const Tooltip: Directive = {
	beforeMount,
	unmounted,
	updated(element, binding) {
		if (binding.value === binding.oldValue) return;
		unmounted(element);

		if (binding.value) {
			beforeMount(element, binding);
		}
	},
};

export default Tooltip;
