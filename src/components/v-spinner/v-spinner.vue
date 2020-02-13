<template>
	<div class="v-spinner" :class="sizeClass"></div>
</template>

<script lang="ts">
import { createComponent, computed } from '@vue/composition-api';
import parseCSSVar from '@/utils/parse-css-var';
import useSizeClass, { sizeProps } from '@/compositions/size-class';

export default createComponent({
	props: sizeProps,
	setup(props) {
		const sizeClass = useSizeClass(props);
		return { sizeClass };
	}
});
</script>

<style lang="scss" scoped>
.v-spinner {
	--v-spinner-color: var(--loading-background-color-accent);
	--v-spinner-background-color: var(--loading-background-color);

	--v-spinner-speed: 1s;
	--v-spinner-size: 28px;
	--v-spinner-line-size: 3px;

	width: var(--v-spinner-size);
	height: var(--v-spinner-size);
	position: relative;

	border-radius: 100%;
	border: var(--v-spinner-line-size) solid var(--v-spinner-background-color);
	border-top: var(--v-spinner-line-size) solid var(--v-spinner-color);
	background-color: transparent;

	animation: rotate var(--v-spinner-speed) infinite linear;

	&.x-small {
		--v-spinner-size: 12px;
		--v-spinner-line-size: 2px;
	}

	&.small {
		--v-spinner-size: 16px;
		--v-spinner-line-size: 3px;
	}

	&.large {
		--v-spinner-size: 48px;
		--v-spinner-line-size: 4px;
	}

	&.x-large {
		--v-spinner-size: 64px;
		--v-spinner-line-size: 5px;
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
