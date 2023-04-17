import { capitalize } from 'lodash';

interface HTMLExpandElement extends HTMLElement {
	_parent?: (Node & ParentNode & HTMLElement) | null;
	_initialStyle?: {
		transition: string;
		visibility: string;
		overflow: string;
		height?: string | null;
		width?: string | null;
	};
}

export default function (
	expandedParentClass = '',
	xAxis = false,
	emit: (
		event:
			| 'beforeEnter'
			| 'enter'
			| 'afterEnter'
			| 'enterCancelled'
			| 'beforeLeave'
			| 'leave'
			| 'afterLeave'
			| 'leaveCancelled',
		...args: any[]
	) => void
): Record<string, any> {
	const sizeProperty = xAxis ? 'width' : ('height' as 'width' | 'height');
	const offsetProperty = `offset${capitalize(sizeProperty)}` as 'offsetHeight' | 'offsetWidth';

	return {
		beforeEnter(el: HTMLExpandElement) {
			emit('beforeEnter');

			el._parent = el.parentNode as (Node & ParentNode & HTMLElement) | null;

			el._initialStyle = {
				transition: el.style.transition,
				visibility: el.style.visibility,
				overflow: el.style.overflow,
				[sizeProperty]: el.style[sizeProperty],
			};
		},

		enter(el: HTMLExpandElement) {
			emit('enter');

			const initialStyle = el._initialStyle;
			if (!initialStyle) return;
			const offset = `${el[offsetProperty]}px`;

			el.style.setProperty('transition', 'none', 'important');
			el.style.visibility = 'hidden';
			el.style.visibility = initialStyle.visibility;
			el.style.overflow = 'hidden';
			el.style[sizeProperty] = '0';

			void el.offsetHeight; // force reflow

			el.style.transition =
				initialStyle.transition !== '' ? initialStyle.transition : `${sizeProperty} var(--medium) var(--transition)`;

			if (expandedParentClass && el._parent) {
				el._parent.classList.add(expandedParentClass);
			}

			requestAnimationFrame(() => {
				el.style[sizeProperty] = offset;
			});
		},

		afterEnter(el: HTMLExpandElement) {
			emit('afterEnter');
			resetStyles(el);
		},

		enterCancelled(el: HTMLExpandElement) {
			emit('enterCancelled');
			resetStyles(el);
		},

		beforeLeave(el: HTMLExpandElement) {
			emit('beforeLeave');

			el._parent = el.parentNode as (Node & ParentNode & HTMLElement) | null;

			el._initialStyle = {
				transition: el.style.transition,
				visibility: el.style.visibility,
				overflow: el.style.overflow,
				[sizeProperty]: el.style[sizeProperty],
			};
		},

		leave(el: HTMLExpandElement) {
			emit('leave');

			const initialStyle = el._initialStyle;
			if (!initialStyle) return;

			el.style.setProperty('transition', 'none', 'important');
			el.style.overflow = 'hidden';
			el.style[sizeProperty] = `${el[offsetProperty]}px`;

			void el.offsetHeight; // force reflow

			el.style.transition =
				initialStyle.transition !== '' ? initialStyle.transition : `${sizeProperty} var(--medium) var(--transition)`;

			if (expandedParentClass && el._parent) {
				el._parent.classList.add(expandedParentClass);
			}

			requestAnimationFrame(() => (el.style[sizeProperty] = '0'));
		},

		afterLeave(el: HTMLExpandElement) {
			emit('afterLeave');

			if (expandedParentClass && el._parent) {
				el._parent.classList.remove(expandedParentClass);
			}

			resetStyles(el);
		},
		leaveCancelled(el: HTMLExpandElement) {
			emit('leaveCancelled');

			if (expandedParentClass && el._parent) {
				el._parent.classList.remove(expandedParentClass);
			}

			resetStyles(el);
		},
	};

	function resetStyles(el: HTMLExpandElement) {
		if (!el._initialStyle) return;
		const size = el._initialStyle[sizeProperty];
		el.style.overflow = el._initialStyle.overflow;
		if (size != null) el.style[sizeProperty] = size;
		delete el._initialStyle;
	}
}
