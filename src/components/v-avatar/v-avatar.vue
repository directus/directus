<template>
	<div class="v-avatar" :class="[{ tile }, sizeClass]">
		<slot />
	</div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useSizeClass, { sizeProps } from '@/compositions/size-class';

export default defineComponent({
	props: {
		size: {
			type: Number,
			default: null,
		},
		tile: {
			type: Boolean,
			default: false,
		},
		...sizeProps,
	},
	setup(props) {
		const sizeClass = useSizeClass(props);
		return { sizeClass };
	},
});
</script>

<style lang="scss" scoped>
.v-avatar {
	--v-avatar-color: var(--primary);
	--v-avatar-size: 48px;

	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--v-avatar-size);
	height: var(--v-avatar-size);
	overflow: hidden;
	color: var(--white);
	white-space: nowrap;
	text-overflow: ellipsis;
	background-color: var(--v-avatar-color);
	border-radius: 50%;

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
