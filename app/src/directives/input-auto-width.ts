import { Directive } from 'vue';

interface AutoWidthElement extends HTMLInputElement {
	shadow: HTMLElement;
	onUpdate?: () => void;
}

const InputAutoWidth: Directive = {
	mounted: (el: AutoWidthElement) => {
		el.onUpdate = () => updateWidth(el);

		el.shadow = document.createElement('div');
		el.shadow.setAttribute('aria-hidden', 'true');
		copyStyles(el);
		document.body.appendChild(el.shadow);

		updateWidth(el);

		el.addEventListener('input', el.onUpdate);
	},

	updated: (el: AutoWidthElement) => {
		if (el.onUpdate) el.onUpdate();
	},

	unmounted: (el: AutoWidthElement) => {
		document.body.removeChild(el.shadow);

		if (el.onUpdate) el.removeEventListener('input', el.onUpdate);
	},
};

function updateWidth(el: AutoWidthElement) {
	const value = el.value || el.placeholder;
	el.shadow.textContent = value;

	el.style.inlineSize = `${el.shadow.scrollWidth}px`;
}

function copyStyles(el: AutoWidthElement) {
	const styles = window.getComputedStyle(el);

	Object.assign(el.shadow.style, {
		position: 'absolute',
		insetBlockStart: '0',
		insetInlineStart: '0',
		visibility: 'hidden',
		blockSize: '0',
		overflow: 'hidden',
		whiteSpace: 'pre',
		fontSize: styles.fontSize,
		fontFamily: styles.fontFamily,
		fontWeight: styles.fontWeight,
		fontStyle: styles.fontStyle,
		letterSpacing: styles.letterSpacing,
		textTransform: styles.textTransform,
		paddingInlineEnd: `calc(${styles.paddingInlineEnd} + ${styles.borderInlineEndWidth})`,
		paddingInlineStart: `calc(${styles.paddingInlineStart} + ${styles.borderInlineStartWidth})`,
	});
}

export default InputAutoWidth;
