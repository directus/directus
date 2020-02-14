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
	--v-spinner-color: var(--foreground-color);
	--v-spinner-background-color: var(--background-color-alt);
	--v-spinner-speed: 1s;
	--v-spinner-size: 28px;
	--v-spinner-line-size: 3px;

	position: relative;
	width: var(--v-spinner-size);
	height: var(--v-spinner-size);
	background-color: transparent;
	border: var(--v-spinner-line-size) solid var(--v-spinner-background-color);
	border-top: var(--v-spinner-line-size) solid var(--v-spinner-color);
	border-radius: 100%;
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
