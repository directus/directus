export const percentage = (value: number, limit: number | undefined) => {
	if (!limit) return null;
	if (!value) return 100;
	return 100 - (value / Number(limit)) * 100;
};
