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

	el.style.width = `${el.shadow.scrollWidth}px`;
}

function copyStyles(el: AutoWidthElement) {
	const styles = window.getComputedStyle(el);

	Object.assign(el.shadow.style, {
		position: 'absolute',
		top: '0',
		left: '0',
		visibility: 'hidden',
		height: '0',
		overflow: 'hidden',
		whiteSpace: 'pre',
		fontSize: styles.fontSize,
		fontFamily: styles.fontFamily,
		fontWeight: styles.fontWeight,
		fontStyle: styles.fontStyle,
		letterSpacing: styles.letterSpacing,
		textTransform: styles.textTransform,
		paddingRight: `calc(${styles.paddingRight} + ${styles.borderRightWidth})`,
		paddingLeft: `calc(${styles.paddingLeft} + ${styles.borderLeftWidth})`,
	});
}

export default InputAutoWidth;
