import { Directive } from 'vue';

const PreventFocusout: Directive = {
	mounted(el: HTMLElement, binding) {
		if (binding.value) {
			el.addEventListener('focusout', preventFocusout);
		}
	},
	updated(el: HTMLElement, binding) {
		if (binding.oldValue && !binding.value) {
			el.removeEventListener('focusout', preventFocusout);

			if (!el.contains(document.activeElement))
				el.dispatchEvent(
					new FocusEvent('focusout', {
						bubbles: true,
						composed: true,
						view: window,
					}),
				);
		}

		if (binding.value && !binding.oldValue) {
			el.addEventListener('focusout', preventFocusout);

			if (!el.contains(document.activeElement)) {
				el.dispatchEvent(
					new FocusEvent('focusin', {
						bubbles: true,
					}),
				);
			}
		}
	},
};

function preventFocusout(event: FocusEvent) {
	event.preventDefault();
	event.stopPropagation();
}

export default PreventFocusout;
