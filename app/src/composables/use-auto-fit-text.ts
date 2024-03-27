import { Ref } from 'vue';

function extractValues(paddingString: string): { top: number; right: number; bottom: number; left: number } {
	const paddingValues: number[] = paddingString
		.split(' ')
		.map((value) => parseFloat(value.trim()))
		.filter((value) => !isNaN(value));

	let top = 0,
		right = 0,
		bottom = 0,
		left = 0;

	switch (paddingValues.length) {
		case 1:
			top = right = bottom = left = paddingValues[0]!;
			break;
		case 2:
			top = paddingValues[0]!;
			right = paddingValues[1]!;
			bottom = top;
			left = right;
			break;
		case 3:
			top = paddingValues[0]!;
			right = paddingValues[1]!;
			bottom = paddingValues[2]!;
			left = right;
			break;
		case 4:
			top = paddingValues[0]!;
			right = paddingValues[1]!;
			bottom = paddingValues[2]!;
			left = paddingValues[3]!;
			break;
	}

	return { top, right, bottom, left };
}

export function useAutoFontFit(parent: Ref<HTMLElement | null>, child: Ref<HTMLElement | null>) {
	const adjustFontSize = () => {
		const parentContainer = parent.value;
		const childContainer = child.value;

		if (!parentContainer || !childContainer) return;

		const padding = extractValues(parentContainer.style.padding);
		const margin = extractValues(childContainer.style.margin);

		// Starting font size boundaries in px
		let minFontSize = 2;
		let maxFontSize = 512;

		// The precision of the linear search
		const precision = 0.15;
		// The factor by which the remaining range must exceed the precision to continue binary search
		const switchingFactor = 4;

		// Calculated container dimensions
		const calcHeight = parentContainer.offsetHeight - padding.top - padding.bottom - margin.top - margin.bottom;
		const calcWidth = parentContainer.offsetWidth - padding.left - padding.right - margin.left - margin.right;

		// Function to update font size
		const setFontSize = (size: number) => {
			childContainer.style.fontSize = `${size}px`;
		};

		let fontSize;

		while (maxFontSize - minFontSize > precision * switchingFactor) {
			// Increase the precision threshold
			fontSize = (maxFontSize + minFontSize) / 2;
			setFontSize(fontSize);

			if (childContainer.offsetHeight > calcHeight || childContainer.offsetWidth > calcWidth) {
				maxFontSize = fontSize;
			} else {
				minFontSize = fontSize;
			}
		}

		// Linear search for fine-tuning
		fontSize = minFontSize;
		setFontSize(fontSize);

		while (childContainer.offsetHeight <= calcHeight && childContainer.offsetWidth <= calcWidth) {
			fontSize += precision; // Fine-tuning increment
			setFontSize(fontSize);
		}

		// Step back one small increment to ensure fit
		fontSize -= precision;
		setFontSize(fontSize);
	};

	return { adjustFontSize };
}
