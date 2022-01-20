export const percentage = (value: number, limit: number | undefined) => {
	if (!limit) return null;
	if (!value) return 100;
	if (limit) return 100 - (value / +limit) * 100;
	return 100;
};
