import { computed, ComputedRef } from 'vue';

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

interface RequiredProps {
	xSmall: boolean;
	small: boolean;
	large: boolean;
	xLarge: boolean;
}

export default function useSizeClass<T>(props: T & RequiredProps): ComputedRef<string | null> {
	return computed<string | null>(() => {
		if (props.xSmall) return 'x-small';
		if (props.small) return 'small';
		if (props.large) return 'large';
		if (props.xLarge) return 'x-large';
		return null;
	});
}

export function useSizePropValues<T>(props: T & RequiredProps): ComputedRef<RequiredProps> {
	return computed<string | null>(() => {
		const { xSmall, small, large, xLarge } = props;
		return { xSmall, small, large, xLarge };
	});
}
