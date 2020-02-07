import Vue, { DirectiveOptions, DirectiveFunction } from 'vue';

export const definition: DirectiveOptions = {
	inserted(el) {
		el.focus();
	}
};

Vue.directive('focus', definition);
