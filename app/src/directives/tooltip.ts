import { nanoid } from 'nanoid';
import { Directive, DirectiveBinding } from 'vue';
import { useUserStore } from '@/stores/user';

const tooltipDelay = 500;

const handlers: Record<string, () => void> = {};

function beforeMount(element: HTMLElement, binding: DirectiveBinding): void {
	if (binding.value) {
		element.dataset.tooltip = nanoid();
		handlers[element.dataset.tooltip] = createEnterHandler(element, binding);
		element.addEventListener('mouseenter', handlers[element.dataset.tooltip]);
		element.addEventListener('mouseleave', onLeaveTooltip);
	}
}

function unmounted(element: HTMLElement): void {
	element.removeEventListener('mouseenter', handlers[element.dataset.tooltip as string]);
	element.removeEventListener('mouseleave', onLeaveTooltip);
	clearTimeout(tooltipTimer);
	const tooltip = getTooltip();
	tooltip.classList.remove('visible');
	delete handlers[element.dataset.tooltip as string];
}

const Tooltip: Directive = {
	beforeMount,
	unmounted,
	updated(element, binding) {
		if (binding.value && !binding.oldValue) {
			beforeMount(element, binding);
		} else if (!binding.value && binding.oldValue) {
			unmounted(element);
		} else {
			unmounted(element);
			beforeMount(element, binding);
		}
	},
};

export default Tooltip;

let tooltipTimer: number;

export function createEnterHandler(element: HTMLElement, binding: DirectiveBinding) {
	return (): void => {
		const tooltip = getTooltip();

		if (binding.modifiers.instant) {
			animateIn(tooltip);
			updateTooltip(element, binding, tooltip);
		} else {
			clearTimeout(tooltipTimer);

			tooltipTimer = window.setTimeout(() => {
				animateIn(tooltip);
				updateTooltip(element, binding, tooltip);
			}, tooltipDelay);
		}
	};
}

export function onLeaveTooltip(): void {
	const tooltip = getTooltip();

	clearTimeout(tooltipTimer);
	animateOut(tooltip);
}

export function updateTooltip(element: HTMLElement, binding: DirectiveBinding, tooltip: HTMLElement): void {
	const userStore = useUserStore();

	const offset = 10;
	const arrowAlign = 20;

	const isRTL = userStore.textDirection === 'rtl';

	const bounds = element.getBoundingClientRect();
	let top = bounds.top + pageYOffset;
	let left = bounds.left + pageXOffset;

	if (isRTL) {
		left = window.innerWidth - bounds.right + pageXOffset;
	}

	let transformPos;

	tooltip.innerText = binding.value;
	tooltip.classList.remove('top', 'bottom', 'left', 'right', 'start', 'end');

	let placement = binding.arg ?? 'top';

	if ('top' in binding.modifiers) placement = 'top';
	if ('right' in binding.modifiers) placement = 'right';
	if ('bottom' in binding.modifiers) placement = 'bottom';
	if ('left' in binding.modifiers) placement = 'left';

	if (binding.modifiers.inverted) {
		tooltip.classList.add('inverted');
	} else {
		tooltip.classList.remove('inverted');
	}

	if (binding.modifiers.monospace) {
		tooltip.classList.add('monospace');
	}

	if (placement === 'bottom') {
		if (binding.modifiers.start) {
			left += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			left += bounds.width - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			left += bounds.width / 2;
			transformPos = 50;
		}

		top += bounds.height + offset;

		if (isRTL) {
			tooltip.style.transform = `translate(calc(-${left}px + ${transformPos}%), ${top}px)`;
		} else {
			tooltip.style.transform = `translate(calc(${left}px - ${transformPos}%), ${top}px)`;
		}

		tooltip.classList.add('bottom');
	} else if (placement === 'left') {
		if (binding.modifiers.start) {
			top += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			top += bounds.height - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			top += bounds.height / 2;
			transformPos = 50;
		}

		left -= offset;

		if (isRTL) {
			tooltip.style.transform = `translate(calc(-${left}px + 100%), calc(${top}px - ${transformPos}%))`;
		} else {
			tooltip.style.transform = `translate(calc(${left}px - 100%), calc(${top}px - ${transformPos}%))`;
		}

		tooltip.classList.add('left');
	} else if (placement === 'right') {
		if (binding.modifiers.start) {
			top += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			top += bounds.height - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			top += bounds.height / 2;
			transformPos = 50;
		}

		left += bounds.width + offset;

		if (isRTL) {
			tooltip.style.transform = `translate(-${left}px, calc(${top}px - ${transformPos}%))`;
		} else {
			tooltip.style.transform = `translate(${left}px, calc(${top}px - ${transformPos}%))`;
		}

		tooltip.classList.add('right');
	} else {
		if (binding.modifiers.start) {
			left += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			left += bounds.width - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			left += bounds.width / 2;
			transformPos = 50;
		}

		top -= offset;

		if (isRTL) {
			tooltip.style.transform = `translate(calc(-${left}px + ${transformPos}%), calc(${top}px - 100%))`;
		} else {
			tooltip.style.transform = `translate(calc(${left}px - ${transformPos}%), calc(${top}px - 100%))`;
		}

		tooltip.classList.add('top');
	}
}

export function animateIn(tooltip: HTMLElement): void {
	tooltip.classList.add('visible', 'enter');
	tooltip.classList.remove('leave', 'leave-active');

	setTimeout(() => {
		if (tooltip.classList.contains('enter') === false) return;
		tooltip.classList.add('enter-active');
		tooltip.classList.remove('enter');
	}, 1);

	setTimeout(() => {
		tooltip.classList.remove('enter-active');
	}, 200);
}

export function animateOut(tooltip: HTMLElement): void {
	if (tooltip.classList.contains('visible') === false) return;

	tooltip.classList.add('visible', 'leave');
	tooltip.classList.remove('enter', 'enter-active');

	setTimeout(() => {
		if (tooltip.classList.contains('leave') === false) return;
		tooltip.classList.add('leave-active');
		tooltip.classList.remove('leave');
	}, 1);

	setTimeout(() => {
		if (tooltip.classList.contains('leave-active') === false) return;
		tooltip.classList.remove('leave-active');
		tooltip.classList.remove('visible');
	}, 200);
}

export function getTooltip(): HTMLElement {
	let tooltip = document.getElementById('tooltip');

	if (tooltip instanceof HTMLElement) {
		return tooltip;
	}

	tooltip = document.createElement('div');
	tooltip.id = 'tooltip';
	document.body.appendChild(tooltip);

	return tooltip;
}
