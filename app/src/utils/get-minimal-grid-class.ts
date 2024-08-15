import stringWidth from "string-width";

type Option = {
	text: string;
	value: string | number | boolean;
};

export const getMinimalGridClass = (choices: Option[] | undefined, width: string | undefined) => {
	if (!choices) return null;

	const widestOptionLength = choices.reduce((acc, val) => {
		const currWidth = stringWidth(val.text);
		if (currWidth > acc) acc = currWidth;
		return acc;
	}, 0);

	const getMinimalGridClassName = (size: number) => {
		return `grid-${Math.min(choices.length, size)}`;
	};

	if (width?.startsWith('half')) {
		if (widestOptionLength <= 10) return getMinimalGridClassName(2);
		return getMinimalGridClassName(1);
	}

	if (widestOptionLength <= 10) return getMinimalGridClassName(4);
	if (widestOptionLength > 10 && widestOptionLength <= 15) return getMinimalGridClassName(3);
	if (widestOptionLength > 15 && widestOptionLength <= 25) return getMinimalGridClassName(2);
	return getMinimalGridClassName(1);
}
