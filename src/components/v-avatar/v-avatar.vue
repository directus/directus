<template>
	<div class="v-avatar" :class="[{ tile }, sizeClass]">
		<slot />
	</div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '../../utils/parse-css-var';

export default createComponent({
	props: {
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
		const sizeClass = computed<string | null>(() => {
			if (props.xSmall) return 'x-small';
			if (props.small) return 'small';
			if (props.large) return 'large';
			if (props.xLarge) return 'x-large';
			return null;
		});

		return { sizeClass };
	}
});
</script>

<style lang="scss" scoped>
.v-avatar {
	--v-avatar-color: var(--teal);
	--v-avatar-size: 48px;

	background-color: var(--v-avatar-color);
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	width: var(--v-avatar-size);
	height: var(--v-avatar-size);
	border-radius: 50%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	color: var(--white);

	&.tile {
		border-radius: 0;
	}

	&.x-small {
		--v-avatar-size: 24px;
	}

	&.small {
		--v-avatar-size: 36px;
	}

	&.large {
		--v-avatar-size: 56px;
	}

	&.x-large {
		--v-avatar-size: 64px;
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
