import { DirectiveOptions } from 'vue';

const Focus: DirectiveOptions = {
	inserted(el, binding) {
		if (binding.value) {
			el.focus();
		} else {
			el.blur();
		}
	},
};

export default Focus;
