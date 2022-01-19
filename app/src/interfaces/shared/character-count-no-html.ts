export const percentageRemaining = (currentCount: number, limit: number | undefined) => {
	if (!limit) return null;
	if (!currentCount) return 100;
	if (limit) return 100 - (currentCount / +limit) * 100;
	return 100;
};
