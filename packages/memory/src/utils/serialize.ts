const encoder = new TextEncoder();

export const serialize = (val: unknown) => {
	const valueString = JSON.stringify(val);
	return encoder.encode(valueString);
}
