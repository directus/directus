export function abbreviateNumber(number: number, decimalPlaces = 0, units: string[] = ['K', 'M', 'B', 'T']): string {
	const isNegative = number < 0;

	number = Math.abs(number);

	let stringValue = String(number);

	if (number >= 1000) {
		const precisionScale = Math.pow(10, decimalPlaces);

		for (let i = units.length - 1; i >= 0; i--) {
			const size = Math.pow(10, (i + 1) * 3);

			if (size <= number) {
				number = Math.round((number * precisionScale) / size) / precisionScale;

				if (number === 1000 && i < units.length - 1) {
					number = 1;
					i++;
				}

				stringValue = number.toFixed(decimalPlaces) + units[i];

				break;
			}
		}
	}

	if (isNegative) {
		stringValue = `-${stringValue}`;
	}

	return stringValue;
}
