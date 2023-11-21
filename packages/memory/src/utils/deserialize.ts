const decoder = new TextDecoder();

export const deserialize = <T = unknown>(val: Uint8Array) => {
	const valueString = decoder.decode(val);
	return <T>JSON.parse(valueString);
}
