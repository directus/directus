import { Directive } from 'vue';

export const Focus: Directive = {
	mounted(el, binding) {
		if (binding.value) {
			el.focus();
		} else {
			el.blur();
		}
	},
};
