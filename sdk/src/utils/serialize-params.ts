/**
 * @TODO Serialize parameters better
 * @TODO Type params better
 */

export const serializeParams = (params: Record<string, any>) => {
	const result = Object.fromEntries(
		Object.entries(params).map((item) => {
			if (typeof item[1] === 'object' && !Array.isArray(item[1])) {
				return [item[0], JSON.stringify(item[1])];
			}

			return item;
		})
	);

	return new URLSearchParams(result).toString();
};
