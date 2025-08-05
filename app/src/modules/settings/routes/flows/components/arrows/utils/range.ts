/**
 * Generates an array of numbers within a specified range with a given step interval.
 * Creates a sequence starting from the minimum value, incrementing by the step size,
 * and always includes the maximum value as the final element regardless of step alignment.
 *
 * The function iterates from min to max (exclusive) using the specified step,
 * then explicitly appends the max value to ensure the endpoint is always included
 * in the result, even if it wouldn't naturally align with the step progression.
 *
 * @param min - Starting value of the range (inclusive)
 * @param max - Ending value of the range (always included as final element)
 * @param step - Increment between consecutive values in the sequence (must be non-zero)
 * @returns Array of numbers from min to max with the specified step interval
 * @throws {Error} When step is zero (would cause infinite loop)
 *
 * @example
 * ```typescript
 * // Basic range with step of 1
 * const sequence = range(0, 5, 1);
 * // Returns: [0, 1, 2, 3, 4, 5]
 * ```
 *
 * @example
 * ```typescript
 * // Range with larger step size
 * const evenNumbers = range(0, 10, 2);
 * // Returns: [0, 2, 4, 6, 8, 10]
 * ```
 *
 * @example
 * ```typescript
 * // Step doesn't align with max - max still included
 * const misaligned = range(0, 7, 3);
 * // Returns: [0, 3, 6, 7]
 * // Note: 7 is included even though 6 + 3 = 9 > 7
 * ```
 *
 * @example
 * ```typescript
 * // Decimal step values
 * const decimals = range(0, 1, 0.25);
 * // Returns: [0, 0.25, 0.5, 0.75, 1]
 * ```
 */
export function range(min: number, max: number, step: number) {
	if (step === 0) {
		throw new Error('Step cannot be zero as it would cause an infinite loop');
	}

	const points: number[] = [];

	for (let i = min; i < max; i += step) {
		points.push(i);
	}

	points.push(max);
	return points;
}
