import { HelperOverrides } from '.';

export const oracle = {
	integer: {
		min: -(10n ** 125n),
		max: 10n ** 125n,
	},
} as const satisfies HelperOverrides;
