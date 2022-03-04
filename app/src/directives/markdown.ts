import { Directive } from 'vue';
import { md } from '@/utils/md';

const Markdown: Directive = {
	beforeMount(el, binding) {
		el.innerHTML = md(binding.value ?? '', binding.modifiers?.newtab);
	},
	updated(el, binding) {
		el.innerHTML = md(binding.value ?? '', binding.modifiers?.newtab);
	},
};

export default Markdown;
