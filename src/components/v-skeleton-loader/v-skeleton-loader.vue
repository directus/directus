<template functional>
	<transition name="fade">
		<div class="v-skeleton-loader" :class="props.type" />
	</transition>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
	props: {
		type: {
			type: String,
			default: 'input',
		},
	},
});
</script>

<style lang="scss" scoped>
.v-skeleton-loader {
	position: relative;
	overflow: hidden;
	background-color: var(--background-subdued);
	cursor: progress;

	&::after {
		position: absolute;
		top: 0;
		right: 0;
		left: 0;
		z-index: 1;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transform: translateX(-100%);
		animation: loading 1.5s infinite;
		content: '';
	}

	@keyframes loading {
		100% {
			transform: translateX(100%);
		}
	}
}

.input,
.input-tall {
	width: 100%;
	height: var(--input-height);
	border: var(--border-width) solid var(--background-subdued);
	border-radius: var(--border-radius);
}

.input-tall {
	height: var(--input-height-tall);
}

.fade-enter-active,
.fade-leave-active {
	transition: opacity var(--medium) var(--transition);
}

.fade-enter,
.fade-leave-to {
	position: absolute;
	opacity: 0;
}
</style>
