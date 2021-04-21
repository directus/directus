export function abbreviateNumber(value: number) {
	if (value >= 1000) {
		const suffixes = ['', 'K', 'M', 'B', 'T'];
		const suffixNum = Math.floor(('' + value).length / 3);
		let shortValue: number = value;

		for (let precision = 2; precision >= 1; precision--) {
			shortValue = parseFloat((suffixNum != 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(precision));
			const dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g, '');
			if (dotLessShortValue.length <= 2) break;
		}

		let valueAsString: string = String(shortValue);

		if (shortValue % 1 != 0) {
			valueAsString = shortValue.toFixed(1);
		}

		return shortValue + suffixes[suffixNum];
	}

	return value;
}
