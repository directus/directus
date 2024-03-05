import { i18n } from '@/lang';
import { md } from '@/utils/md';
import { notify } from '@/utils/notify';
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

	const codeBlocks = el.querySelectorAll('pre');

	if (codeBlocks.length === 0 || !navigator?.clipboard?.writeText) return;

	for (const codeBlock of codeBlocks) {
		const code = codeBlock.querySelector('code');
		if (!code) continue;

		const copyButton = document.createElement('button');
		copyButton.classList.add('copy');
		copyButton.setAttribute('title', i18n.global.t('copy'));

		copyButton.addEventListener('click', async () => {
			let text = code.innerText;

			const isShell = /language-(shellscript|shell|bash|sh|zsh)/.test(codeBlock.className);

			if (isShell) text = text.replace(/^ *(\$|>) /gm, '').trim();

			try {
				await navigator?.clipboard?.writeText(text);

				notify({
					title: i18n.global.t('copy_raw_value_success'),
				});
			} catch {
				notify({
					type: 'error',
					title: i18n.global.t('copy_raw_value_fail'),
				});
			}

			copyButton.blur();
		});

		codeBlock.prepend(copyButton);
	}
}

export default Markdown;
