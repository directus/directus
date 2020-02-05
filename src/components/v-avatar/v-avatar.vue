<template>
	<div class="v-avatar" :style="styles" :class="[{ tile }, sizeClass]">
		<slot />
	</div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '../../utils/parse-css-var';

export default createComponent({
	props: {
		color: {
			type: String,
			default: '--teal'
		},
		size: {
			type: Number,
			default: null
		},
		tile: {
			type: Boolean,
			default: false
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
			'--_v-avatar-color': string;
			'--_v-avatar-size'?: string;
		};

		const styles = computed(() => {
			const styles: Styles = {
				'--_v-avatar-color': parseCSSVar(props.color)
			};

			if (props.size) {
				styles['--_v-avatar-size'] = props.size + 'px';
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

		return { styles, sizeClass };
	}
});
</script>

<style lang="scss" scoped>
.v-avatar {
	--_v-avatar-size: 48px;

	background-color: var(--_v-avatar-color);
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	width: var(--_v-avatar-size);
	height: var(--_v-avatar-size);
	border-radius: 50%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: var(--white);

	&.tile {
		border-radius: 0;
	}

	&.x-small {
		--_v-avatar-size: 24px;
	}

	&.small {
		--_v-avatar-size: 36px;
	}

	&.large {
		--_v-avatar-size: 56px;
	}

	&.x-large {
		--_v-avatar-size: 64px;
	}

	::v-deep {
		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}
}
</style>
