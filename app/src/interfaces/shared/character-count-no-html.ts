export const characterCountMinusHTML = (container: Element | undefined) => {
	if (!container || !container.childNodes) return 0;
	let totalCharacters = 0;
	for (const node of container.childNodes) {
		if (node && node.textContent) {
			const noBreaks = node.textContent.replaceAll('\n', '');
			totalCharacters += noBreaks.length;
		}
	}
	return totalCharacters;
};

export const percentageRemaining = (currentCount: number, limit: number | undefined) => {
	if (!limit) return null;
	if (!currentCount) return 100;
	if (limit) return 100 - (currentCount / +limit) * 100;
	return 100;
};
