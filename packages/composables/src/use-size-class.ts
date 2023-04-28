import type { ComputedRef } from 'vue';
import { computed } from 'vue';

export const sizeProps = {
	xSmall: {
		type: Boolean,
		default: false,
	},
	small: {
		type: Boolean,
		default: false,
	},
	large: {
		type: Boolean,
		default: false,
	},
	xLarge: {
		type: Boolean,
		default: false,
	},
};

interface SizeProps {
	xSmall?: boolean;
	small?: boolean;
	large?: boolean;
	xLarge?: boolean;
}

export function useSizeClass<T>(props: T & SizeProps): ComputedRef<string | null> {
	const sizeClass = computed<string | null>(() => {
		if (props.xSmall) return 'x-small';
		if (props.small) return 'small';
		if (props.large) return 'large';
		if (props.xLarge) return 'x-large';
		return null;
	});

	return sizeClass;
}
