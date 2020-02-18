import { DirectiveOptions } from 'vue';

const Focus: DirectiveOptions = {
	inserted(el) {
		el.focus();
	}
};

export default Focus;
