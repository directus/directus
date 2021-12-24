import { Directive } from 'vue';
import { md } from '@/utils/md';

const Markdown: Directive = {
	beforeMount(el, binding) {
		el.innerHTML = md(binding.value ?? '');
	},
	updated(el, binding) {
		el.innerHTML = md(binding.value ?? '');
	},
};

export default Markdown;
