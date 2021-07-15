import { Directive } from 'vue';
import { md } from '@/utils/md';

const Focus: Directive = {
	beforeMount(el, binding) {
		el.innerHTML = md(binding.value ?? '');
	},
};

export default Focus;
