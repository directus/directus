import stringWidth from 'string-width';

type Option = {
	text: string;
};

export function getMinimalGridClass(choices?: Option[], interfaceWidth?: string) {
	if (!choices || choices.length === 0) return null;

	const widestOptionLength = choices.reduce((acc, value) => {
		const width = stringWidth(value.text);
		if (width > acc) acc = width;
		return acc;
	}, 0);

	const getMinimalGridClassName = (size: number) => {
		return `grid-${Math.min(choices.length, size)}`;
	};

	if (interfaceWidth?.startsWith('half')) {
		if (widestOptionLength <= 10) return getMinimalGridClassName(2);
		return getMinimalGridClassName(1);
	}

	if (widestOptionLength <= 10) return getMinimalGridClassName(4);
	if (widestOptionLength > 10 && widestOptionLength <= 15) return getMinimalGridClassName(3);
	if (widestOptionLength > 15 && widestOptionLength <= 25) return getMinimalGridClassName(2);
	return getMinimalGridClassName(1);
}
