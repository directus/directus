import { Directive } from 'vue';

const PreventFocusout: Directive = {
	mounted(el: HTMLElement, binding) {
		if (binding.value) {
			el.addEventListener('focusout', preventFocusout);
		}
	},
	updated(el: HTMLElement, binding) {
		console.log('updated', binding.value, binding.oldValue);

		if (binding.oldValue && !binding.value) {
			el.removeEventListener('focusout', preventFocusout);

			console.log('focusout', el.contains(document.activeElement));

			if (!el.contains(document.activeElement))
				el.dispatchEvent(
					new FocusEvent('focusout', {
						bubbles: true,
					}),
				);
		}

		if (binding.value && !binding.oldValue) {
			el.addEventListener('focusout', preventFocusout);

			console.log('focusin', el.contains(document.activeElement));

			if (!el.contains(document.activeElement))
				el.dispatchEvent(
					new FocusEvent('focusin', {
						bubbles: true,
					}),
				);
		}
	},
};

function preventFocusout(event: FocusEvent) {
	console.log('Prevented Focusout');
	event.preventDefault();
	event.stopPropagation();
}

export default PreventFocusout;
