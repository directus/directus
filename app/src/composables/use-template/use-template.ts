import { watch, onMounted, onUnmounted, Ref, ComponentPublicInstance, computed } from 'vue';

export function useTemplate(
	element: Ref<ComponentPublicInstance | HTMLElement | undefined>,
	text: Ref<string | null>,
	regex: RegExp,
	renderBlockFn: (block: string) => HTMLElement
) {
	const contentEl = computed(() => {
		if (element.value === undefined) return;
		return element.value instanceof HTMLElement ? element.value : (element.value.$el as HTMLElement);
	});

	watch(() => text.value, setContent, { immediate: true });

	onMounted(() => {
		if (contentEl.value) {
			// contentEl.value.addEventListener('selectstart', onSelect);
			contentEl.value.addEventListener('keydown', onKeyDown);
			contentEl.value.addEventListener('input', onInput);
			setContent();
		}
	});

	onUnmounted(() => {
		if (contentEl.value) {
			// contentEl.value.removeEventListener('selectstart', onSelect);
			contentEl.value.removeEventListener('keydown', onKeyDown);
			contentEl.value.removeEventListener('input', onInput);
		}
	});

	return { addBlock, renderBlock, onInput, contentEl, onKeyDown };

	function onInput() {
		if (!contentEl.value) return;
		const valueString = getInputValue();
		text.value = valueString;
	}

	function deleteBlock(block: HTMLElement) {
		if (text.value === null) return;

		const before = block.previousElementSibling;
		const after = block.nextElementSibling;

		if (!before || !after || !(before instanceof HTMLElement) || !(after instanceof HTMLElement)) return;

		block.removeEventListener('click', blockClicked);
		block.remove();
		joinElements(before, after);
		window.getSelection()?.removeAllRanges();
		onInput();
	}

	function onKeyDown(event: KeyboardEvent) {
		// if (contentEl.value?.innerHTML === '') {
		// 	contentEl.value.innerHTML = '<span class="text"></span>';
		// }
	}

	// function onSelect() {
	// 	if (!contentEl.value) return;
	// 	const selection = window.getSelection();
	// 	if (!selection || selection.rangeCount <= 0) return;
	// 	const range = selection.getRangeAt(0);
	// 	if (!range) return;
	// 	const start = range.startContainer;

	// 	if (
	// 		!(start instanceof HTMLElement && start.classList.contains('text')) &&
	// 		!start.parentElement?.classList.contains('text')
	// 	) {
	// 		selection.removeAllRanges();
	// 		const range = new Range();
	// 		let textSpan = null;

	// 		for (let i = 0; i < contentEl.value.childNodes.length || !textSpan; i++) {
	// 			const child = contentEl.value.children[i];
	// 			if (child.classList.contains('text')) {
	// 				textSpan = child;
	// 			}
	// 		}

	// 		if (!textSpan) {
	// 			textSpan = document.createElement('span');
	// 			textSpan.classList.add('text');
	// 			contentEl.value.appendChild(textSpan);
	// 		}

	// 		range.setStart(textSpan, 0);
	// 		selection.addRange(range);
	// 	}
	// }

	function addBlock(fieldKey: string) {
		if (!contentEl.value) return;

		const block = renderBlock(fieldKey);

		if (window.getSelection()?.rangeCount == 0) {
			const range = document.createRange();
			range.selectNodeContents(contentEl.value.children[0]);
			window.getSelection()?.addRange(range);
		}

		const range = window.getSelection()?.getRangeAt(0);
		if (!range) return;
		range.deleteContents();

		const end = splitElements();

		if (end) {
			contentEl.value.insertBefore(block, end);
			window.getSelection()?.removeAllRanges();
		} else {
			contentEl.value.appendChild(block);
			const span = document.createElement('span');
			span.classList.add('text');
			contentEl.value.appendChild(span);
		}

		onInput();
	}

	function joinElements(first: HTMLElement, second: HTMLElement) {
		first.innerText += second.innerText;
		second.remove();
	}

	function splitElements() {
		const range = window.getSelection()?.getRangeAt(0);
		if (!range) return;

		const textNode = range.startContainer;
		if (textNode.nodeType !== Node.TEXT_NODE) return;
		const start = textNode.parentElement;
		if (!start || !(start instanceof HTMLSpanElement) || !start.classList.contains('text')) return;

		const startOffset = range.startOffset;

		const left = start.textContent?.substr(0, startOffset) || '';
		const right = start.textContent?.substr(startOffset) || '';

		start.innerText = left;

		const nextSpan = document.createElement('span');
		nextSpan.classList.add('text');
		nextSpan.innerText = right;
		contentEl.value?.insertBefore(nextSpan, start.nextSibling);
		return nextSpan;
	}

	function getInputValue() {
		if (!contentEl.value) return null;

		const value = Array.from(contentEl.value.childNodes).reduce((acc, node) => {
			const el = node as HTMLElement;
			let lineBreak = '';

			if (el.nodeType === Node.TEXT_NODE) return (acc += el.textContent);
			if (el.tagName === 'DIV') lineBreak = '\n';
			if (el.hasAttribute('data-field')) return (acc += lineBreak + el.getAttribute('data-field'));
			else if ('textContent' in el) return (acc += lineBreak + el.textContent);
			return (acc += '');
		}, '');

		if (value === '') return null;
		return value;
	}

	function setContent() {
		if (!contentEl.value) return;

		// if (text.value === null || text.value === '') {
		// 	contentEl.value.innerHTML = '<span class="text"></span>';
		// 	return;
		// }

		if (/* text.value !== getInputValue() &&*/ text.value) {
			contentEl.value.innerHTML = '';
			text.value.split(regex).forEach((part) => {
				if (regex.test(part) === false) {
					const text = document.createElement('span');
					text.classList.add('text');
					text.innerText = part;
					contentEl.value?.appendChild(text);
				} else {
					const block = renderBlock(part);
					contentEl.value?.appendChild(block);
				}
			});
		}
	}

	function renderBlock(text: string) {
		const block = renderBlockFn(text);
		block.setAttribute('data-field', text);
		block.contentEditable = 'false';
		block.addEventListener('click', blockClicked);
		return block;
	}

	function blockClicked(event: MouseEvent) {
		if (event.target !== null) deleteBlock(event.target as HTMLElement);
	}
}
