import { md } from '@/utils/md';
import { Directive, DirectiveBinding } from 'vue';

const Markdown: Directive = {
	beforeMount: markdown,
	updated: markdown,
};

function markdown(el: Element, binding: DirectiveBinding) {
	if (typeof binding.value === 'object' && 'value' in binding.value) {
		el.innerHTML = md(binding.value.value, binding.value);
	} else {
		el.innerHTML = md(binding.value ?? '');
	}
}

export default Markdown;
