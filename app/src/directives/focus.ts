import { nextTick, type Directive } from 'vue';

const Focus: Directive = {
	mounted(el, binding) {
		if (binding.value) {
			// Defer focus until after the dialog transition completes and any
			// previously focused element has blurred. Calling el.focus()
			// synchronously in mounted() fires while the trigger element still
			// holds focus, which causes mobile browsers to block the call and
			// prevents the virtual keyboard from appearing inside dialogs.
			nextTick(() => requestAnimationFrame(() => el.focus({ preventScroll: true })));
		} else {
			el.blur();
		}
	},
};

export default Focus;
