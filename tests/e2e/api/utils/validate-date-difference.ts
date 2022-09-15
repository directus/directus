export function validateDateDifference(expectedDate: Date, receivedDate: Date, maxDifferenceMs: number): Date {
	const difference = Math.abs(expectedDate.getTime() - receivedDate.getTime());

	// Return the received date if within the acceptable range
	return difference <= maxDifferenceMs ? receivedDate : expectedDate;
}
