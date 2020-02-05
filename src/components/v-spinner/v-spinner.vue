<template>
	<div class="v-spinner" :class="sizeClass" :style="styles"></div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';

export default createComponent({
	props: {
		color: {
			type: String,
			default: '--loading-background-color-accent'
		},
		backgroundColor: {
			type: String,
			default: '--loading-background-color'
		},
		size: {
			type: Number,
			default: null
		},
		lineSize: {
			type: Number,
			default: null
		},
		speed: {
			type: String,
			default: '1s'
		},
		xSmall: {
			type: Boolean,
			default: false
		},
		small: {
			type: Boolean,
			default: false
		},
		large: {
			type: Boolean,
			default: false
		},
		xLarge: {
			type: Boolean,
			default: false
		}
	},
	setup(props) {
		type Styles = {
			'--_v-spinner-color': string;
			'--_v-spinner-background-color': string;
			'--_v-spinner-speed': string;
			'--_v-spinner-size'?: string;
			'--_v-spinner-line-size'?: string;
		};

		const styles = computed(() => {
			const styles: Styles = {
				'--_v-spinner-color': parseCSSVar(props.color),
				'--_v-spinner-background-color': parseCSSVar(props.backgroundColor),
				'--_v-spinner-speed': props.speed
			};

			if (props.size) {
				styles['--_v-spinner-size'] = `${props.size}px`;
			}

			if (props.lineSize) {
				styles['--_v-spinner-line-size'] = `${props.lineSize}px`;
			}

			return styles;
		});

		const sizeClass = computed<string | null>(() => {
			if (props.xSmall) return 'x-small';
			if (props.small) return 'small';
			if (props.large) return 'large';
			if (props.xLarge) return 'x-large';
			return null;
		});

		return {
			styles,
			sizeClass
		};
	}
});
</script>

<style lang="scss" scoped>
.v-spinner {
	--_v-spinner-size: 28px;
	--_v-spinner-line-size: 3px;

	width: var(--_v-spinner-size);
	height: var(--_v-spinner-size);
	position: relative;

	border-radius: 100%;
	border: var(--_v-spinner-line-size) solid var(--_v-spinner-background-color);
	border-top: var(--_v-spinner-line-size) solid var(--_v-spinner-color);
	background-color: transparent;

	animation: rotate var(--_v-spinner-speed) infinite linear;

	&.x-small {
		--_v-spinner-size: 12px;
		--_v-spinner-line-size: 2px;
	}

	&.small {
		--_v-spinner-size: 16px;
		--_v-spinner-line-size: 3px;
	}

	&.large {
		--_v-spinner-size: 48px;
		--_v-spinner-line-size: 4px;
	}

	&.x-large {
		--_v-spinner-size: 64px;
		--_v-spinner-line-size: 5px;
	}
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}
</style>
