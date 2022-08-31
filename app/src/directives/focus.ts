import { Directive } from 'vue';

const Focus: Directive = {
	mounted(el, binding) {
		if (binding.value) {
			el.focus();
		} else {
			el.blur();
		}
	},
};

export default Focus;
