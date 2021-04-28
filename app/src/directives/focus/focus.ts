import { Directive } from 'vue';

const Focus: Directive = {
	inserted(el, binding) {
		if (binding.value) {
			el.focus();
		} else {
			el.blur();
		}
	},
};

export default Focus;
